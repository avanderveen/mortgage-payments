import mortgagePayments from 'mp/mortgagePayments.ts';

const LOCALE = 'en-CA';

const CAD = Intl.NumberFormat(
    LOCALE,
    {
        style: 'currency',
        currency: 'CAD'
    }
);

const format = (date: Date): string => {
    return date.toLocaleDateString(
        LOCALE,
        {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }
    );
}

function addColumn(
    row: HTMLTableRowElement,
    content: any,
    format: 'text' | 'currency' = 'currency'
) {
    const td = document.createElement('td');
    td.innerHTML = format === 'currency' ? CAD.format(content) : content;
    row.appendChild(td);
}

export default function init() {
    document.forms[0].onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(document.forms[0]);
        const frequency = formData.get('frequency') as string;
        const startDate = formData.get('start')
            ? new Date(formData.get('start') as string)
            : new Date();
        if (frequency === 'semiMonthly') {
            if (Math.abs(startDate.getDate() - 15) < 15) {
                startDate.setDate(1);
            } else {
                startDate.setDate(15);
            }
        }

        const payments = mortgagePayments(
            parseFloat(formData.get('principal') as string),
            parseFloat(formData.get('rate') as string),
            frequency,
            parseFloat(formData.get('term') as string),
            parseFloat(formData.get('amortization') as string)
        );

        const tbody = document.getElementsByTagName('tbody')[0];
        tbody.innerHTML = '';
        const offset = frequencyOffset(frequency);
        for (var paymentData of payments) {
            const row = document.createElement('tr');
            const date = offset.paymentDate(startDate, paymentData.paymentId);
            addColumn(row, paymentData.paymentId + 1, 'text');
            addColumn(row, format(date), 'text');
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

interface FrequencyOffset {
    paymentDate(start: Date, paymentNumber: number): Date;
}

function frequencyOffset(frequency: string): FrequencyOffset {
    if (frequency === 'semiMonthly') {
        return new SemiMonthlyFrequencyOffset();
    }

    return new SimpleFrequencyOffset(frequency);
}

class SimpleFrequencyOffset implements FrequencyOffset {
    private readonly unit: string;
    private readonly amount: number;

    constructor(frequency: string) {
        switch (frequency) {
            case 'weekly':
                this.unit = 'weeks';
                this.amount = 1;
                break;
            case 'biWeekly':
                this.unit = 'weeks';
                this.amount = 2;
                break;
            case 'montly':
                this.unit = 'months';
                this.amount = 1;
                break;
            default:
                throw new Error(`Not supported: ${frequency}`);
        }
    }

    paymentDate(start: Date, paymentNumber: number): Date {
        return moment(start).add(
            this.unit,
            this.amount * paymentNumber
        ).toDate();
    }
}

class SemiMonthlyFrequencyOffset implements FrequencyOffset {
    paymentDate(start: Date, paymentNumber: number): Date {
        const date = moment(new Date(start)).add('months', Math.floor(paymentNumber / 2)).toDate();
        date.setDate(paymentNumber % 2 === 0 ? 1 : 15);
        return date;
    }
}

declare function moment(date: Date): Moment

declare interface Moment {
    add(unit: string, amount: number): Moment
    toDate(): Date
}
