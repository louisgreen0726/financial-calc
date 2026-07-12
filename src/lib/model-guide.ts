export interface ModelGuide {
  title: string;
  description: string;
  decisionNoticeTitle: string;
  decisionNotice: string;
  assumptions: string;
  workedExample: string;
  limitations: string;
  sections: Array<{
    title: string;
    assumptions: string[];
    example: string;
    limitations: string[];
  }>;
}

const guides: Record<"en" | "zh", ModelGuide> = {
  en: {
    title: "Model assumptions & worked examples",
    description: "Interpret calculator outputs using the same timing, rate, and statistical conventions as the engine.",
    decisionNoticeTitle: "Use results as model outputs, not verified advice",
    decisionNotice:
      "Results are deterministic estimates from the assumptions you enter. They are not quotes, forecasts, accounting or tax conclusions, or investment advice. Fees, taxes, inflation, credit events, liquidity, and local market conventions are excluded unless a calculator names them explicitly. Independently validate material decisions.",
    assumptions: "Assumptions",
    workedExample: "Worked example",
    limitations: "Limitations",
    sections: [
      {
        title: "TVM, cash flow & loans",
        assumptions: [
          "TVM rates are per period and must use the same unit as NPER. Cash paid out is negative, cash received is positive, and payments occur at period end unless Beginning is selected.",
          "Cash-flow item 0 occurs today; later items are one equal period apart. NPV includes item 0. IRR returns one bracketed root, while projects with multiple sign changes can have multiple or no economically useful IRRs.",
          "Loans use a fixed nominal annual rate divided by 12 and whole monthly periods. CPM fixes the payment; CAM fixes principal repayment.",
        ],
        example:
          "TVM: PV = -10,000, rate = 5% per period, NPER = 10, PMT = 0 gives FV = 16,288.95. Cash flows [-1,000, 600, 600] at 10% give NPV = 41.32.",
        limitations: [
          "Convert quoted annual rates to the required periodic rate before using TVM or cash-flow tools.",
          "Loan schedules exclude fees, insurance, taxes, prepayments, variable rates, and lender-specific per-row rounding, so they are not payoff statements.",
        ],
      },
      {
        title: "Bonds & fixed income",
        assumptions: [
          "Pricing assumes a plain fixed-rate bond, level coupons, face value repaid at maturity, whole coupon periods, and one supplied YTM compounded at the coupon frequency.",
          "Macaulay duration, modified duration, and convexity use the same flat yield and scheduled cash flows as the price.",
        ],
        example:
          "Face value 1,000, 5% annual coupon, 5 years, 4% YTM, and semiannual coupons gives a price of 1,044.91.",
        limitations: [
          "No settlement date, accrued interest, clean/dirty price distinction, day-count convention, yield curve, credit/default risk, embedded option, tax, or inflation adjustment is modeled.",
          "Duration and convexity are local rate-sensitivity approximations, not a full repricing guarantee for large or non-parallel curve moves.",
        ],
      },
      {
        title: "Equity valuation",
        assumptions: [
          "CAPM uses one beta and one expected market return. WACC uses supplied market values and a constant tax shield on debt.",
          "The Gordon DDM treats D1 as the next-period dividend, assumes perpetual constant growth, and requires the discount rate to exceed growth.",
        ],
        example: "DDM: next dividend D1 = 3.00, required return = 9%, and perpetual growth = 3% gives value = 50.00.",
        limitations: [
          "Outputs are highly sensitive to beta, market premium, capital structure, terminal growth, and discount-rate estimates.",
          "The tools do not model multi-stage growth, dilution, distress, issuance costs, country risk, or company-specific cash-flow forecasts.",
        ],
      },
      {
        title: "Options & implied volatility",
        assumptions: [
          "Black-Scholes-Merton assumes a European option, lognormal spot dynamics, constant volatility, continuously compounded risk-free and dividend yields, continuous trading, and no arbitrage or transaction costs.",
          "Time is in years. Theta is reported per calendar day; Vega and Rho are reported for a one-percentage-point change in volatility or rate.",
        ],
        example:
          "A one-year European call with spot = strike = 100, risk-free rate = 5%, dividend yield = 2%, and volatility = 20% has price 9.227. Using market price 9.227 returns implied volatility near 20.00%.",
        limitations: [
          "No American early exercise, discrete dividend schedule, volatility smile/surface, jumps, stochastic rates, transaction costs, or liquidity effects are modeled.",
          "Implied volatility is bounded to the supported 0%-500% domain and is meaningful only under the same BSM assumptions and input units.",
        ],
      },
      {
        title: "Portfolio & risk",
        assumptions: [
          "Portfolio samples are long-only and fully invested. Returns, volatility, and risk-free rate are annual percentages; every asset pair uses the same supplied correlation. Sharpe is (return - risk-free rate) / volatility.",
          "VaR and CVaR assume zero-mean normally distributed returns and scale annual volatility by the square root of days / 252. Reported amounts are positive loss magnitudes.",
        ],
        example:
          "With 60% in an 8% return / 15% risk asset, 40% in a 4% return / 5% risk asset, correlation 0.20, and risk-free rate 2%, the portfolio has return 6.40%, risk 9.60%, and Sharpe 0.46.",
        limitations: [
          "A single equal-correlation input is not a covariance matrix, and random sampling does not prove a global optimum or account for estimation error, turnover, costs, constraints, or rebalancing.",
          "Normal VaR can materially understate fat tails, serial dependence, volatility changes, liquidity gaps, and stress losses; it requires independent backtesting and scenario analysis.",
        ],
      },
      {
        title: "Macroeconomic scenarios",
        assumptions: [
          "Inflation and purchasing-power tools compound a constant rate over the stated years. Real interest uses the exact Fisher relation rather than nominal minus inflation.",
          "CPI comparisons assume compatible index baskets and bases. PPP reports foreign-currency units per one domestic-currency unit from the two entered prices.",
        ],
        example:
          "A 5% nominal rate with 3% inflation gives a 1.9417% real rate. At constant 3% inflation, 10,000 of current purchasing power becomes 7,440.94 after 10 years.",
        limitations: [
          "These are constant-input scenarios, not inflation, interest-rate, CPI, or exchange-rate forecasts.",
          "Actual CPI baskets, taxes, consumption patterns, tradability, capital controls, and transaction costs can make personal inflation and market exchange rates differ from the model.",
        ],
      },
    ],
  },
  zh: {
    title: "模型假设与计算示例",
    description: "按照计算引擎采用的期次、利率与统计口径理解结果。",
    decisionNoticeTitle: "请将结果视为模型输出，而非经核验的建议",
    decisionNotice:
      "结果是根据您输入的假设生成的确定性估算，不是报价、预测、会计或税务结论，也不构成投资建议。除非计算器明确列出，否则结果不包含费用、税费、通胀、信用事件、流动性及当地市场惯例。对于重大决策，请进行独立复核。",
    assumptions: "假设",
    workedExample: "计算示例",
    limitations: "限制",
    sections: [
      {
        title: "货币时间价值、现金流与贷款",
        assumptions: [
          "TVM 利率是每期利率，必须与 NPER 使用相同期次单位。现金流出为负、流入为正；除非选择期初，否则付款发生在期末。",
          "现金流第 0 项发生在当前，后续项目按等长周期排列；NPV 包含第 0 项。IRR 返回一个被括住的根，多次符号变化的项目可能存在多个根或不存在有经济意义的根。",
          "贷款使用固定名义年利率除以 12，并按完整月份计算。等额本息固定每期付款，等额本金固定每期偿还本金。",
        ],
        example:
          "TVM：PV = -10,000、每期利率 = 5%、NPER = 10、PMT = 0，得到 FV = 16,288.95。现金流 [-1,000, 600, 600] 按 10% 折现时，NPV = 41.32。",
        limitations: [
          "使用 TVM 或现金流工具前，需要自行把报价年利率换算为所需的每期利率。",
          "贷款计划不含手续费、保险、税费、提前还款、浮动利率及贷款机构逐期舍入，因此不能作为正式结清金额。",
        ],
      },
      {
        title: "债券与固定收益",
        assumptions: [
          "定价假设普通固定票息债券、等额票息、到期偿还面值、完整票息期，以及按票息频率复利的单一给定 YTM。",
          "麦考利久期、修正久期与凸性使用与价格相同的平坦收益率和约定现金流。",
        ],
        example: "面值 1,000、年票息率 5%、期限 5 年、YTM 4%、每半年付息，债券价格为 1,044.91。",
        limitations: [
          "模型未包含结算日、应计利息、净价/全价、日计数惯例、收益率曲线、信用违约、内嵌期权、税费或通胀调整。",
          "久期和凸性只是局部利率敏感度近似，不能保证在大幅或非平行曲线变动下等同于完整重新定价。",
        ],
      },
      {
        title: "权益估值",
        assumptions: [
          "CAPM 使用单一 Beta 和预期市场回报；WACC 使用输入的市场价值，并假设债务税盾恒定。",
          "戈登 DDM 将 D1 视为下一期股利，假设永续稳定增长，并要求折现率高于增长率。",
        ],
        example: "DDM：下一期股利 D1 = 3.00、必要回报率 = 9%、永续增长率 = 3%，得到价值 = 50.00。",
        limitations: [
          "结果对 Beta、市场风险溢价、资本结构、终值增长率与折现率估计高度敏感。",
          "工具未建模多阶段增长、稀释、财务困境、发行成本、国家风险或公司特定现金流预测。",
        ],
      },
      {
        title: "期权与隐含波动率",
        assumptions: [
          "Black-Scholes-Merton 假设欧式期权、标的价格服从对数正态过程、波动率恒定、无风险利率和股息收益率连续复利、可连续交易，且不存在套利与交易成本。",
          "时间单位为年。Theta 按一个日历日计；Vega 和 Rho 分别按波动率或利率变动一个百分点计。",
        ],
        example:
          "一年期欧式看涨期权，现价 = 执行价 = 100、无风险利率 = 5%、股息收益率 = 2%、波动率 = 20%，价格为 9.227；以市场价 9.227 反解得到约 20.00% 的隐含波动率。",
        limitations: [
          "模型未包含美式提前行权、离散股息、波动率微笑/曲面、跳跃、随机利率、交易成本或流动性影响。",
          "隐含波动率限于工具支持的 0%-500% 区间，且只有在相同 BSM 假设和输入单位下才有可比意义。",
        ],
      },
      {
        title: "投资组合与风险",
        assumptions: [
          "投资组合采样只允许做多且权重合计 100%。收益率、波动率和无风险利率均为年化百分比；所有资产对使用同一个相关系数。Sharpe =（收益率 - 无风险利率）/ 波动率。",
          "VaR 与 CVaR 假设收益率为零均值正态分布，并按天数 / 252 的平方根缩放年化波动率；显示金额是正数形式的损失规模。",
        ],
        example:
          "资产 A 的收益/风险为 8%/15%、权重 60%；资产 B 为 4%/5%、权重 40%；相关系数 0.20、无风险利率 2% 时，组合收益 6.40%、风险 9.60%、Sharpe 0.46。",
        limitations: [
          "单一等相关系数并非完整协方差矩阵；随机采样也不能证明全局最优，且未考虑估计误差、换手、成本、约束或再平衡。",
          "正态 VaR 可能显著低估厚尾、序列相关、波动率变化、流动性缺口与压力损失，必须结合独立回测和情景分析。",
        ],
      },
      {
        title: "宏观经济情景",
        assumptions: [
          "通胀与购买力工具在给定年份内按恒定利率复利；实际利率采用精确 Fisher 关系，而不是简单用名义利率减通胀率。",
          "CPI 比较假设指数篮子和基期可比；PPP 根据两项输入价格，输出每一单位本币对应的外币单位数。",
        ],
        example:
          "名义利率 5%、通胀率 3% 时，实际利率为 1.9417%。若通胀率恒为 3%，当前 10,000 的购买力在 10 年后相当于 7,440.94。",
        limitations: [
          "这些是恒定输入情景，不是对通胀、利率、CPI 或汇率的预测。",
          "实际 CPI 篮子、税费、消费结构、商品可贸易性、资本管制和交易成本都可能使个人通胀与市场汇率偏离模型。",
        ],
      },
    ],
  },
};

export function getModelGuide(language: "en" | "zh"): ModelGuide {
  return guides[language];
}
