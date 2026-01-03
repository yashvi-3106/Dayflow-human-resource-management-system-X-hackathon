/**
 * Calculates salary structure and net salary based on Gross Salary and Payable Days.
 * 
 * Rules:
 * Basic = 40% of Gross
 * HRA = 30% of Basic
 * Conveyance = 10% of Gross
 * PF (Deduction) = 12% of Basic
 * Insurance (Deduction) = 2% of Basic
 */
const calculatePayroll = (grossSalary, payableDays, totalDaysInMonth) => {
    // 1. Calculate Fixed Structure (Allowances)
    const basic = Math.round(grossSalary * 0.40);
    const hra = Math.round(basic * 0.30);
    const conveyance = Math.round(grossSalary * 0.10);

    // 2. Calculate Deductions (Based on Basic)
    const pf = Math.round(basic * 0.12);
    const insurance = Math.round(basic * 0.02);
    // Fixed total deductions for reference (full month)
    // const totalDeductions = pf + insurance;

    // 3. Calculate Net Salary
    // Formula: (Gross / TotalDays) * PayableDays - Deductions
    // Note: Deductions are usually fixed monthly, but for partial months, 
    // strictly speaking, they might be pro-rated too. 
    // To keep it simple and consistent with "Payable Days" logic:
    // We calculate "Earned Gross" first.

    const dailyWage = grossSalary / totalDaysInMonth;
    const earnedGross = Math.round(dailyWage * payableDays);

    // Calculate Earned Basic (Pro-rata)
    const earnedBasic = Math.round((basic / totalDaysInMonth) * payableDays);

    // Deductions on Earned Basic
    const earnedPF = Math.round(earnedBasic * 0.12);
    const earnedInsurance = Math.round(earnedBasic * 0.02);
    const earnedDeductions = earnedPF + earnedInsurance;

    const netSalary = earnedGross - earnedDeductions;

    return {
        salaryStructure: {
            basic,
            hra,
            conveyance,
            pf, // Fixed structure shown for reference
            insurance
        },
        calculated: {
            earnedGross,
            earnedBasic,
            earnedDeductions,
            netSalary: Math.round(netSalary)
        }
    };
};

module.exports = { calculatePayroll };
