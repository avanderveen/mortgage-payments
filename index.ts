import mortgagePayments from 'mp/mortgagePayments.ts';

const CAD = Intl.NumberFormat("en-CA", { style: 'currency', currency: 'CAD' })

function addColumn(
    row: HTMLTableRowElement,
    content: any,
    format: "text" | "currency" = "currency"
) {
    const td = document.createElement("td");
    td.innerHTML = format === "currency" ? CAD.format(content) : content;
    row.appendChild(td);
}

export default function init() {
    document.forms[0].onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(document.forms[0]);
        const start = formData.get("start") ? new Date(formData.get("start") as string) : new Date();
        const payments = mortgagePayments(
            parseFloat(formData.get("principal") as string),
            parseFloat(formData.get("rate") as string),
            formData.get("frequency") as string,
            parseFloat(formData.get("term") as string),
            parseFloat(formData.get("amortization") as string)
        );

        const tbody = document.getElementsByTagName("tbody")[0];
        tbody.innerHTML = "";
        for (var paymentData of payments) {
            const row = document.createElement("tr");
            addColumn(row, paymentData.paymentId + 1, "text");
            const date = new Date(start.getFullYear(), start.getMonth(), 1);
            date.setMonth(start.getMonth() + paymentData.paymentId);
            addColumn(row, date.toLocaleDateString('en-CA', { year:"numeric", month:"short" }), "text");
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
