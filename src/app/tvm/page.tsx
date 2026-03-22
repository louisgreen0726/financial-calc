"use client";

import { useState } from "react";
import { Finance } from "@/lib/finance-math";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calculator, ArrowRightLeft, RotateCcw } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { EmptyState } from "@/components/empty-state";
import { ErrorDisplay, ValidationError } from "@/components/ui/error-display";
import { useFormValidation } from "@/hooks/use-validation";
import { cn } from "@/lib/utils";

type TVMTarget = "pv" | "fv" | "pmt" | "nper" | "rate";

export default function TVMPage() {
  const { t } = useLanguage();
  const [target, setTarget] = useState<TVMTarget>("fv");

  // State for inputs (strings to allow empty state)
  const [rate, setRate] = useState<string>("5");
  const [nper, setNper] = useState<string>("10");
  const [pmt, setPmt] = useState<string>("0");
  const [pv, setPv] = useState<string>("-1000");
  const [fv, setFv] = useState<string>("0");
  const [type, setType] = useState<"0" | "1">("0"); // 0 = End (Arrears), 1 = Begin (Due)

  const [result, setResult] = useState<number | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const { errors, validateField, validateAll, clearErrors } = useFormValidation();

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
      setCalculationError("Please fix the validation errors before calculating.");
      setResult(null);
      return;
    }

    const r = parseFloat(rate) / 100; // Convert percentage to decimal
    const n = parseFloat(nper);
    const p = parseFloat(pmt);
    const pres = parseFloat(pv);
    const fut = parseFloat(fv);
    const t = parseInt(type) as 0 | 1;

    let res = 0;

    try {
      switch (target) {
        case "fv":
          res = Finance.fv(r, n, p, pres, t);
          break;
        case "pv":
          res = Finance.pv(r, n, p, fut, t);
          break;
        case "pmt":
          res = Finance.pmt(r, n, pres, fut, t);
          break;
        case "nper":
          res = Finance.nper(r, p, pres, fut, t);
          break;
        case "rate":
          res = Finance.rate(n, p, pres, fut, t);
          break;
      }

      if (isNaN(res) || !isFinite(res)) {
        setCalculationError("Calculation resulted in an invalid value. Please check your inputs.");
        setResult(null);
      } else {
        setResult(res);
        setCalculationError(null);
      }
    } catch (e) {
      console.error(e);
      setCalculationError("An error occurred during calculation. Please verify your inputs.");
      setResult(null);
    }
  };

  const handleClear = () => {
    setRate("5");
    setNper("10");
    setPmt("0");
    setPv("-1000");
    setFv("0");
    setType("0");
    setResult(null);
    setCalculationError(null);
    setTouchedFields({});
    clearErrors();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("tvm.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("tvm.subtitle")}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
              <Label>{t("common.solveFor")}</Label>
              <Select
                value={target}
                onValueChange={(v) => {
                  setTarget(v as TVMTarget);
                  setResult(null);
                  setCalculationError(null);
                }}
              >
                <SelectTrigger>
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

            {calculationError && (
              <ErrorDisplay message={calculationError} onDismiss={() => setCalculationError(null)} className="mb-4" />
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={target === "rate" ? "text-primary font-bold" : ""}>{t("tvm.annualRate")}</Label>
                <Input
                  type="number"
                  value={rate}
                  onChange={(e) => handleInputChange("rate", e.target.value, setRate)}
                  disabled={target === "rate"}
                  className={cn(errors.rate && touchedFields.rate && "border-red-500 focus-visible:ring-red-500")}
                />
                <ValidationError error={errors.rate && touchedFields.rate ? errors.rate : null} />
              </div>
              <div className="space-y-2">
                <Label className={target === "nper" ? "text-primary font-bold" : ""}>{t("tvm.periods")}</Label>
                <Input
                  type="number"
                  value={nper}
                  onChange={(e) => handleInputChange("nper", e.target.value, setNper)}
                  disabled={target === "nper"}
                  className={cn(errors.nper && touchedFields.nper && "border-red-500 focus-visible:ring-red-500")}
                />
                <ValidationError error={errors.nper && touchedFields.nper ? errors.nper : null} />
              </div>
              <div className="space-y-2">
                <Label className={target === "pmt" ? "text-primary font-bold" : ""}>{t("tvm.payment")}</Label>
                <Input
                  type="number"
                  value={pmt}
                  onChange={(e) => handleInputChange("pmt", e.target.value, setPmt)}
                  disabled={target === "pmt"}
                  className={cn(errors.pmt && touchedFields.pmt && "border-red-500 focus-visible:ring-red-500")}
                />
                <ValidationError error={errors.pmt && touchedFields.pmt ? errors.pmt : null} />
              </div>
              <div className="space-y-2">
                <Label className={target === "pv" ? "text-primary font-bold" : ""}>{t("tvm.presentValue")}</Label>
                <Input
                  type="number"
                  value={pv}
                  onChange={(e) => handleInputChange("pv", e.target.value, setPv)}
                  disabled={target === "pv"}
                  className={cn(errors.pv && touchedFields.pv && "border-red-500 focus-visible:ring-red-500")}
                />
                <ValidationError error={errors.pv && touchedFields.pv ? errors.pv : null} />
              </div>
              <div className="space-y-2">
                <Label className={target === "fv" ? "text-primary font-bold" : ""}>{t("tvm.futureValue")}</Label>
                <Input
                  type="number"
                  value={fv}
                  onChange={(e) => handleInputChange("fv", e.target.value, setFv)}
                  disabled={target === "fv"}
                  className={cn(errors.fv && touchedFields.fv && "border-red-500 focus-visible:ring-red-500")}
                />
                <ValidationError error={errors.fv && touchedFields.fv ? errors.fv : null} />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label>{t("tvm.paymentMode")}</Label>
              <RadioGroup
                value={type}
                onValueChange={(v) => setType(v as "0" | "1")}
                className="flex items-center space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="end" />
                  <Label htmlFor="end">{t("tvm.end")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="begin" />
                  <Label htmlFor="begin">{t("tvm.begin")}</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleCalculate} className="flex-1" size="lg">
                {t("common.calculate")} {target.toUpperCase()}
              </Button>
              <Button onClick={handleClear} variant="outline" size="lg" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result Card */}
        <Card
          className={cn(
            "border-2 flex flex-col justify-center items-center p-8 text-center",
            calculationError || (result !== null && (isNaN(result) || !isFinite(result)))
              ? "bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
              : "bg-muted/30 border-dashed"
          )}
        >
          {result !== null && !isNaN(result) && isFinite(result) ? (
            <div className="space-y-2 animate-in fade-in zoom-in duration-300">
              <h3 className="text-lg font-medium text-muted-foreground">
                {t("common.result")} ({target.toUpperCase()})
              </h3>
              <p className="text-5xl font-bold tracking-tighter text-primary">
                {target === "nper"
                  ? result.toFixed(2)
                  : target === "rate"
                    ? `${(result * 100).toFixed(4)}%`
                    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(result)}
              </p>
              <p className="text-sm text-muted-foreground mt-4 max-w-xs mx-auto">
                {target === "fv" && t("tvm.resultDesc.fv")}
                {target === "pv" && t("tvm.resultDesc.pv")}
                {target === "pmt" && t("tvm.resultDesc.pmt")}
                {target === "nper" && t("tvm.resultDesc.nper")}
                {target === "rate" && t("tvm.resultDesc.rate")}
              </p>
            </div>
          ) : calculationError || (result !== null && (isNaN(result) || !isFinite(result))) ? (
            <div className="space-y-3">
              <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                <Calculator className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-red-800 dark:text-red-200">Calculation Error</h3>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1 max-w-xs">
                  {calculationError || "Unable to calculate result. Please check your inputs and try again."}
                </p>
              </div>
            </div>
          ) : (
            <EmptyState icon={ArrowRightLeft} title={t("tvm.emptyState")} />
          )}
        </Card>
      </div>
    </div>
  );
}
