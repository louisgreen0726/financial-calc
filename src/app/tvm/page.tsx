"use client";

import { useState, Suspense } from "react";
import { Finance } from "@/lib/finance-math";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calculator, ArrowRightLeft, RotateCcw } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { CalculationSteps } from "@/components/calculation-steps";
import { InputRangeHint } from "@/components/input-range-hint";

import { ErrorDisplay, ValidationError } from "@/components/ui/error-display";
import { useFormValidation } from "@/hooks/use-validation";
import { useCalculationHistory } from "@/hooks/use-calculation-history";
import { HistoryPanel } from "@/components/history-panel";
import { useUrlState } from "@/hooks/use-url-state";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveDisclosure } from "@/components/responsive-disclosure";
import { useLocaleFormat } from "@/hooks/use-locale-format";
import { ResultShell } from "@/components/result-shell";
import { ResultActions } from "@/components/result-actions";

type TVMTarget = "pv" | "fv" | "pmt" | "nper" | "rate";

const SYMBOLS = {
  arrowRight: "\u2192",
  multiply: "\u00D7",
  approximately: "\u2248",
};

const TVM_PRESETS = {
  retirement: {
    labelKey: "tvm.presets.retirement",
    values: { target: "fv", rate: "7", nper: "30", pmt: "-500", pv: "0", fv: "0", type: "0" as const },
  },
  loanPayoff: {
    labelKey: "tvm.presets.loanPayoff",
    values: { target: "pmt", rate: "4.5", nper: "60", pmt: "0", pv: "25000", fv: "0", type: "0" as const },
  },
  collegeFund: {
    labelKey: "tvm.presets.collegeFund",
    values: { target: "pmt", rate: "6", nper: "18", pmt: "0", pv: "0", fv: "120000", type: "1" as const },
  },
} as const;

function TVMPageContent() {
  const { t } = useLanguage();
  const { formatCurrencyLocale } = useLocaleFormat();
  const {
    state: urlState,
    setState,
    setField,
    shareUrl,
  } = useUrlState({
    defaultValues: {
      target: "fv" as string,
      rate: "5",
      nper: "10",
      pmt: "0",
      pv: "1000",
      fv: "0",
      type: "0", // 0 = End (Arrears), 1 = Begin (Due)
    },
    prefix: "tvm",
  });

  const target = urlState.target as TVMTarget;
  const setTarget = (v: TVMTarget) => setField("target", v);

  const rate = urlState.rate as string;
  const setRate = (v: string) => setField("rate", v);

  const nper = urlState.nper as string;
  const setNper = (v: string) => setField("nper", v);

  const pmt = urlState.pmt as string;
  const setPmt = (v: string) => setField("pmt", v);

  const pv = urlState.pv as string;
  const setPv = (v: string) => setField("pv", v);

  const fv = urlState.fv as string;
  const setFv = (v: string) => setField("fv", v);

  const type = urlState.type as "0" | "1";
  const setType = (v: "0" | "1") => setField("type", v);

  const [result, setResult] = useState<number | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const { errors, validateField, validateAll, clearErrors } = useFormValidation();
  const { addToHistory } = useCalculationHistory({ page: "tvm" });
  const [calcSteps, setCalcSteps] = useState<{
    formula: string;
    inputs: Record<string, number>;
    steps: { label: string; value: string; formula?: string }[];
    result: number;
  } | null>(null);

  const handleInputChange = (field: string, value: string, setter: (val: string) => void) => {
    setter(value);
    setTouchedFields((prev) => ({ ...prev, [field]: true }));

    // Validate based on field type
    const options: { required?: boolean; allowNegative?: boolean; allowZero?: boolean; min?: number } = {
      required: true,
    };

    if (field === "rate") {
      options.allowNegative = false;
    } else if (field === "nper") {
      options.allowNegative = false;
      options.allowZero = false;
      options.min = 1;
    }

    validateField(field, value, options);
    setCalculationError(null);
  };

  const handleCalculate = () => {
    // Mark all fields as touched
    const allFields = ["rate", "nper", "pmt", "pv", "fv"].filter((f) => f !== target);
    const newTouched: Record<string, boolean> = {};
    allFields.forEach((field) => {
      newTouched[field] = true;
    });
    setTouchedFields((prev) => ({ ...prev, ...newTouched }));

    // Validate all inputs
    const fieldsToValidate: Record<
      string,
      { value: string; options?: { required?: boolean; allowNegative?: boolean; allowZero?: boolean; min?: number } }
    > = {};

    if (target !== "rate") {
      fieldsToValidate.rate = { value: rate, options: { required: true, allowNegative: false } };
    }
    if (target !== "nper") {
      fieldsToValidate.nper = {
        value: nper,
        options: { required: true, allowNegative: false, allowZero: false, min: 1 },
      };
    }
    if (target !== "pmt") {
      fieldsToValidate.pmt = { value: pmt, options: { required: true } };
    }
    if (target !== "pv") {
      fieldsToValidate.pv = { value: pv, options: { required: true } };
    }
    if (target !== "fv") {
      fieldsToValidate.fv = { value: fv, options: { required: true } };
    }

    const isValid = validateAll(fieldsToValidate);

    if (!isValid) {
      setCalculationError(t("tvm.fixValidation"));
      setResult(null);
      return;
    }

    const r = parseFloat(rate) / 100; // Convert percentage to decimal
    const n = parseFloat(nper);
    const p = parseFloat(pmt);
    const pres = parseFloat(pv);
    const fut = parseFloat(fv);
    const paymentType = parseInt(type) as 0 | 1;

    let res = 0;

    try {
      switch (target) {
        case "fv":
          res = Finance.fv(r, n, p, pres, paymentType);
          break;
        case "pv":
          res = Finance.pv(r, n, p, fut, paymentType);
          break;
        case "pmt":
          res = Finance.pmt(r, n, pres, fut, paymentType);
          break;
        case "nper":
          res = Finance.nper(r, p, pres, fut, paymentType);
          break;
        case "rate":
          res = Finance.rate(n, p, pres, fut, paymentType);
          break;
      }

      if (isNaN(res) || !isFinite(res)) {
        setCalculationError(t("tvm.invalidResult"));
        setResult(null);
      } else {
        setResult(res);
        setCalculationError(null);
        addToHistory(
          { rate, nper, pmt, pv, fv, type, target },
          res,
          `TVM ${SYMBOLS.arrowRight} ${target.toUpperCase()}`
        );

        const compoundFactor = Math.pow(1 + r, n);

        const stepData = {
          fv: {
            formula: `FV = PV(1+r)^n + PMT ${SYMBOLS.multiply} [(1+r)^n - 1] / r`,
            steps: [
              {
                label: "Rate as decimal",
                value: `${rate}% ${SYMBOLS.arrowRight} ${r.toFixed(4)}`,
                formula: "r = rate / 100",
              },
              {
                label: "Compound factor",
                value: `(1+${r.toFixed(4)})^${n} = ${compoundFactor.toFixed(4)}`,
                formula: "(1+r)^n",
              },
              {
                label: "Future Value",
                value: `$${res.toFixed(2)}`,
                formula: `PV(1+r)^n + PMT ${SYMBOLS.multiply} annuity`,
              },
            ],
          },
          pv: {
            formula: `PV = FV / (1+r)^n + PMT ${SYMBOLS.multiply} [(1+r)^n - 1] / r`,
            steps: [
              {
                label: "Rate as decimal",
                value: `${rate}% ${SYMBOLS.arrowRight} ${r.toFixed(4)}`,
                formula: "r = rate / 100",
              },
              {
                label: "Discount factor",
                value: `1 / ${compoundFactor.toFixed(4)} = ${(1 / compoundFactor).toFixed(4)}`,
                formula: "1/(1+r)^n",
              },
              {
                label: "Present Value",
                value: `$${res.toFixed(2)}`,
                formula: `PV = FV/(1+r)^n + PMT ${SYMBOLS.multiply} factor`,
              },
            ],
          },
          pmt: {
            formula: "PMT = (FV - PV(1+r)^n) / annuity_factor",
            steps: [
              {
                label: "Rate as decimal",
                value: `${rate}% ${SYMBOLS.arrowRight} ${r.toFixed(4)}`,
                formula: "r = rate / 100",
              },
              {
                label: "Compound factor",
                value: `(1+${r.toFixed(4)})^${n} = ${compoundFactor.toFixed(4)}`,
                formula: "(1+r)^n",
              },
              {
                label: "Payment",
                value: `$${res.toFixed(2)}`,
                formula: `PMT = (FV-PV${SYMBOLS.multiply}factor) / annuity`,
              },
            ],
          },
          nper: {
            formula: `n = ln[(FV${SYMBOLS.multiply}r+PMT)/(PV${SYMBOLS.multiply}r+PMT)] / ln(1+r)`,
            steps: [
              {
                label: "Rate as decimal",
                value: `${rate}% ${SYMBOLS.arrowRight} ${r.toFixed(4)}`,
                formula: "r = rate / 100",
              },
              {
                label: "Cash flow ratio",
                value: `${fut}${SYMBOLS.multiply}${r}+${p} vs ${pres}${SYMBOLS.multiply}${r}+${p}`,
                formula: `(FV${SYMBOLS.multiply}r+PMT)/(PV${SYMBOLS.multiply}r+PMT)`,
              },
              { label: "Periods", value: `${res.toFixed(2)} years`, formula: "n = ln(ratio) / ln(1+r)" },
            ],
          },
          rate: {
            formula: "Iterative Newton-Raphson approximation",
            steps: [
              { label: "Initial guess", value: "2% per period" },
              { label: "NPV iteration", value: `Refine until NPV ${SYMBOLS.approximately} 0` },
              { label: "Annual rate", value: `${(res * 100).toFixed(4)}%`, formula: `rate ${SYMBOLS.multiply} 100` },
            ],
          },
        };

        setCalcSteps({
          formula: stepData[target].formula,
          inputs: { Rate: parseFloat(rate), Periods: n, PMT: p, PV: pres, FV: fut },
          steps: stepData[target].steps,
          result: res,
        });
      }
    } catch (e) {
      console.error(e);
      setCalculationError(t("tvm.runtimeError"));
      setResult(null);
    }
  };

  const handleClear = () => {
    setState({
      target,
      rate: "5",
      nper: "10",
      pmt: "0",
      pv: "1000",
      fv: "0",
      type: "0",
    });
    setResult(null);
    setCalculationError(null);
    setCalcSteps(null);
    setTouchedFields({});
    clearErrors();
  };

  const applyPreset = (presetKey: keyof typeof TVM_PRESETS) => {
    const preset = TVM_PRESETS[presetKey].values;
    setState(preset);
    setResult(null);
    setCalculationError(null);
    setCalcSteps(null);
    setTouchedFields({});
    clearErrors();
  };

  return (
    <>
      <div className="min-w-0 space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("tvm.title")}</h1>
            <p className="text-muted-foreground mt-2">{t("tvm.subtitle")}</p>
          </div>
        </div>

        <div
          id="tvm-report-content"
          className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                {t("common.parameters")}
              </CardTitle>
              <CardDescription>{t("tvm.emptyState")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label id="tvm-target-label">{t("common.solveFor")}</Label>
                <Select
                  value={target}
                  onValueChange={(v) => {
                    setTarget(v as TVMTarget);
                    setResult(null);
                    setCalculationError(null);
                  }}
                >
                  <SelectTrigger aria-labelledby="tvm-target-label">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fv">{t("tvm.fv")}</SelectItem>
                    <SelectItem value="pv">{t("tvm.pv")}</SelectItem>
                    <SelectItem value="pmt">{t("tvm.pmt")}</SelectItem>
                    <SelectItem value="nper">{t("tvm.nper")}</SelectItem>
                    <SelectItem value="rate">{t("tvm.rate")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label id="tvm-preset-label">{t("tvm.quickPreset")}</Label>
                <Select onValueChange={(value) => applyPreset(value as keyof typeof TVM_PRESETS)}>
                  <SelectTrigger aria-labelledby="tvm-preset-label">
                    <SelectValue placeholder={t("tvm.chooseScenario")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TVM_PRESETS).map(([key, preset]) => (
                      <SelectItem key={key} value={key}>
                        {t(preset.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {calculationError && (
                <ErrorDisplay message={calculationError} onDismiss={() => setCalculationError(null)} className="mb-4" />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tvm-rate" className={target === "rate" ? "text-primary font-bold" : ""}>
                    {t("tvm.annualRate")}
                  </Label>
                  <Input
                    id="tvm-rate"
                    type="number"
                    value={rate}
                    onChange={(e) => handleInputChange("rate", e.target.value, setRate)}
                    disabled={target === "rate"}
                    className={cn(
                      errors.rate && touchedFields.rate && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  <ValidationError error={errors.rate && touchedFields.rate ? errors.rate : null} />
                  <InputRangeHint min={0} max={100} unit="%" example="5" currentValue={parseFloat(rate)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tvm-nper" className={target === "nper" ? "text-primary font-bold" : ""}>
                    {t("tvm.periods")}
                  </Label>
                  <Input
                    id="tvm-nper"
                    type="number"
                    value={nper}
                    onChange={(e) => handleInputChange("nper", e.target.value, setNper)}
                    disabled={target === "nper"}
                    className={cn(
                      errors.nper && touchedFields.nper && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  <ValidationError error={errors.nper && touchedFields.nper ? errors.nper : null} />
                  <InputRangeHint min={1} max={600} unit="periods" example="10" currentValue={parseFloat(nper)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tvm-pmt" className={target === "pmt" ? "text-primary font-bold" : ""}>
                    {t("tvm.payment")}
                  </Label>
                  <Input
                    id="tvm-pmt"
                    type="number"
                    value={pmt}
                    onChange={(e) => handleInputChange("pmt", e.target.value, setPmt)}
                    disabled={target === "pmt"}
                    className={cn(
                      errors.pmt && touchedFields.pmt && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  <ValidationError error={errors.pmt && touchedFields.pmt ? errors.pmt : null} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tvm-pv" className={target === "pv" ? "text-primary font-bold" : ""}>
                    {t("tvm.presentValue")}
                  </Label>
                  <Input
                    id="tvm-pv"
                    type="number"
                    value={pv}
                    onChange={(e) => handleInputChange("pv", e.target.value, setPv)}
                    disabled={target === "pv"}
                    className={cn(errors.pv && touchedFields.pv && "border-destructive focus-visible:ring-destructive")}
                  />
                  <ValidationError error={errors.pv && touchedFields.pv ? errors.pv : null} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tvm-fv" className={target === "fv" ? "text-primary font-bold" : ""}>
                    {t("tvm.futureValue")}
                  </Label>
                  <Input
                    id="tvm-fv"
                    type="number"
                    value={fv}
                    onChange={(e) => handleInputChange("fv", e.target.value, setFv)}
                    disabled={target === "fv"}
                    className={cn(errors.fv && touchedFields.fv && "border-destructive focus-visible:ring-destructive")}
                  />
                  <ValidationError error={errors.fv && touchedFields.fv ? errors.fv : null} />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Label id="tvm-payment-mode-label">{t("tvm.paymentMode")}</Label>
                <RadioGroup
                  value={type}
                  onValueChange={(v) => setType(v as "0" | "1")}
                  className="grid gap-3 sm:grid-cols-2"
                  aria-labelledby="tvm-payment-mode-label"
                >
                  <div className="flex min-h-11 items-center space-x-2 rounded-xl border border-white/10 px-3 py-2">
                    <RadioGroupItem value="0" id="end" />
                    <Label htmlFor="end">{t("tvm.end")}</Label>
                  </div>
                  <div className="flex min-h-11 items-center space-x-2 rounded-xl border border-white/10 px-3 py-2">
                    <RadioGroupItem value="1" id="begin" />
                    <Label htmlFor="begin">{t("tvm.begin")}</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <Button onClick={handleCalculate} className="w-full" size="lg">
                  {t("common.calculate")} {target.toUpperCase()}
                </Button>
                <Button onClick={handleClear} variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
                  <RotateCcw className="h-4 w-4" />
                  {t("common.clear")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <ResultShell
            title={`${t("common.result")} (${target.toUpperCase()})`}
            description={
              target === "fv"
                ? t("tvm.resultDesc.fv")
                : target === "pv"
                  ? t("tvm.resultDesc.pv")
                  : target === "pmt"
                    ? t("tvm.resultDesc.pmt")
                    : target === "nper"
                      ? t("tvm.resultDesc.nper")
                      : t("tvm.resultDesc.rate")
            }
            isReady={result !== null && !isNaN(result) && isFinite(result)}
            emptyTitle={calculationError ? t("tvm.calculationError") : t("tvm.emptyState")}
            emptyDescription={calculationError || undefined}
            emptyIcon={calculationError ? Calculator : ArrowRightLeft}
            actions={
              result !== null && !isNaN(result) && isFinite(result) ? (
                <ResultActions
                  title={`${t("tvm.title")} - ${target.toUpperCase()}`}
                  results={{
                    [target.toUpperCase()]:
                      target === "nper"
                        ? result.toFixed(2)
                        : target === "rate"
                          ? `${(result * 100).toFixed(4)}%`
                          : result,
                  }}
                  inputs={{ rate, nper, pmt, pv, fv, type }}
                  shareUrl={shareUrl}
                  exportJson={{ target, rate, nper, pmt, pv, fv, type, result }}
                  pdfElementId="tvm-report-content"
                  pdfFilename={`tvm-${target}`}
                  pdfTitle={`${t("tvm.title")} - ${target.toUpperCase()}`}
                />
              ) : null
            }
            summary={
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-6 sm:p-8 text-center">
                  <p className="max-w-full overflow-hidden text-balance break-words text-3xl font-bold tracking-tighter text-primary sm:text-5xl">
                    {result === null
                      ? ""
                      : target === "nper"
                        ? result.toFixed(2)
                        : target === "rate"
                          ? `${(result * 100).toFixed(4)}%`
                          : formatCurrencyLocale(result)}
                  </p>
                </CardContent>
              </Card>
            }
          />
        </div>

        {calcSteps && (
          <ResponsiveDisclosure title={t("tvm.stepsTitle")} description={t("tvm.stepsDesc")} defaultOpen={false}>
            <div className="rounded-3xl border border-white/10 bg-card/70 p-1">
              <CalculationSteps {...calcSteps} />
            </div>
          </ResponsiveDisclosure>
        )}
      </div>
      <HistoryPanel
        page="tvm"
        onRestore={(inputs) => {
          setState({
            target: inputs.target !== undefined ? String(inputs.target) : target,
            rate: inputs.rate !== undefined ? String(inputs.rate) : rate,
            nper: inputs.nper !== undefined ? String(inputs.nper) : nper,
            pmt: inputs.pmt !== undefined ? String(inputs.pmt) : pmt,
            pv: inputs.pv !== undefined ? String(inputs.pv) : pv,
            fv: inputs.fv !== undefined ? String(inputs.fv) : fv,
            type: inputs.type !== undefined ? String(inputs.type) : type,
          });
          setResult(null);
          setCalculationError(null);
          setCalcSteps(null);
        }}
      />
    </>
  );
}

function TVMPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-72 mt-2" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader />
          <CardContent className="flex items-center justify-center h-[250px] sm:h-[300px]">
            <Skeleton className="h-32 w-32 rounded-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TVMPage() {
  return (
    <Suspense fallback={<TVMPageSkeleton />}>
      <TVMPageContent />
    </Suspense>
  );
}
