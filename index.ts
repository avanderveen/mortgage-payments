import mortgagePayments from 'mp/mortgagePayments.ts';

const CAD = Intl.NumberFormat("en-CA", { style: 'currency', currency: 'CAD' })

type FrequencyOffset = {
    unit: string
    amount: number
}

function addColumn(
    row: HTMLTableRowElement,
    content: any,
    format: "text" | "currency" = "currency"
) {
    const td = document.createElement("td");
    td.innerHTML = format === "currency" ? CAD.format(content) : content;
    row.appendChild(td);
}

function paymentDate(
    start: Date,
    paymentNumber: number,
    frequency: FrequencyOffset
): Date {
    return moment(start).add(
        frequency.unit,
        frequency.amount * paymentNumber
    ).toDate();
}

function frequencyOffset(
    frequency: string
): FrequencyOffset {
    switch (frequency) {
        case "weekly":      return { unit: 'weeks',  amount: 1 };
        case "biWeekly":    return { unit: 'weeks',  amount: 2 };
        case "monthly":     return { unit: 'months', amount: 1 };
        case "semiMonthly": return { unit: 'months', amount: 0.5 };
        default: throw new Error(`Not supported: ${frequency}`);
    }
}

export default function init() {
    document.forms[0].onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(document.forms[0]);
        const frequency = formData.get("frequency") as string;
        const startDate = formData.get("start")
            ? new Date(formData.get("start") as string)
            : new Date();
        if (frequency === "semiMonthly") {
            if (Math.abs(startDate.getDate() - 15) < 15) {
                startDate.setDate(1);
            } else {
                startDate.setDate(15);
            }
        }

        const payments = mortgagePayments(
            parseFloat(formData.get("principal") as string),
            parseFloat(formData.get("rate") as string),
            frequency,
            parseFloat(formData.get("term") as string),
            parseFloat(formData.get("amortization") as string)
        );

        const tbody = document.getElementsByTagName("tbody")[0];
        tbody.innerHTML = "";
        const offset = frequencyOffset(frequency);
        for (var paymentData of payments) {
            const row = document.createElement("tr");
            addColumn(row, paymentData.paymentId + 1, "text");

            const date = paymentDate(
                startDate,
                paymentData.paymentId,
                offset
            ).toLocaleDateString(
                'en-CA',
                {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                }
            );
            addColumn(row, date, "text");

            addColumn(row, paymentData.payment);
            addColumn(row, paymentData.interest);
            addColumn(row, paymentData.capital);
            addColumn(row, paymentData.balance);
            addColumn(row, paymentData.amountPaid);
            addColumn(row, paymentData.interestPaid);
            addColumn(row, paymentData.capitalPaid);
            tbody.appendChild(row);
        }
    };
}
