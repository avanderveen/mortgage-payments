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
    let payments: PaymentData[] | undefined = undefined;

    const inputs = document.getElementById('inputs') as HTMLFormElement;
    inputs.onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(inputs);
        const frequency = formData.get('frequency') as string;
        const startDate = formData.get('start')
            ? moment(formData.get('start') as string).toDate()
            : new Date();

        payments = mortgagePayments(
            parseFloat(formData.get('principal') as string),
            parseFloat(formData.get('rate') as string),
            frequency,
            parseFloat(formData.get('term') as string),
            parseFloat(formData.get('amortization') as string)
        );

        const tbody = document.getElementsByTagName('tbody')[0];
        tbody.innerHTML = '';
        const offset = frequencyOffset(frequency);
        for (var paymentData of payments!!) {
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

        updatePop(payments!!);
    };
    
    [
        document.getElementById('pop-type') as HTMLSelectElement,
        document.getElementById('pop-start') as HTMLInputElement,
        document.getElementById('pop-end') as HTMLInputElement
    ].forEach(
        (input) => input.addEventListener(
            'change',
            (e) => {
                if (payments !== undefined) {
                    updatePop(payments, input);
                }
                return true;
            }
        )
    );
}

function updatePop(payments: PaymentData[], updated: HTMLElement | undefined = undefined) {
    const popType = (document.getElementById('pop-type') as HTMLSelectElement).value as ReducerType;
    const popStart = document.getElementById('pop-start') as HTMLInputElement;
    const popEnd = document.getElementById('pop-end') as HTMLInputElement;
    const popAmount = document.getElementById('pop-amount') as HTMLDivElement;
    if (updated !== popStart) popStart.value = '1';
    if (updated !== popEnd) popEnd.value = payments.length.toString();
    popAmount.innerText = CAD.format(
        payments.slice(
            parseInt(popStart.value) - 1,
            parseInt(popEnd.value) - 1
        ).reduceRight(Reducer[popType], 0)
    );
}

type ReducerType = 'total' | 'interest' | 'principal';

type PaymentData = {
    paymentId: number
    payment: number
    interest: number
    capital: number
    balance: number
    amountPaid: number
    interestPaid: number
    capitalPaid: number
};

const Reducer = {
    total: (acc: number, curr: PaymentData): number => acc + curr.payment,
    interest: (acc: number, curr: PaymentData): number => acc + curr.interest,
    principal: (acc: number, curr: PaymentData): number => acc + curr.capital,
};

interface FrequencyOffset {
    paymentDate(start: Date, paymentNumber: number): Date;
}

function frequencyOffset(frequency: string): FrequencyOffset {
    if (frequency === 'semiMonthly') {
        return new SemiMonthlyFrequencyOffset();
    }

    return new SimpleFrequencyOffset(frequency);
}

class SemiMonthlyFrequencyOffset implements FrequencyOffset {
    paymentDate(start: Date, paymentNumber: number): Date {
        const date = moment(new Date(start)).add(Math.floor(paymentNumber / 2), 'months').toDate();
        date.setDate(paymentNumber % 2 === 0 ? 1 : 15);
        return date;
    }
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
            case 'monthly':
                this.unit = 'months';
                this.amount = 1;
                break;
            default:
                throw new Error(`Not supported: ${frequency}`);
        }
    }

    paymentDate(start: Date, paymentNumber: number): Date {
        return moment(start).add(
            this.amount * paymentNumber,
            this.unit
        ).toDate();
    }
}

declare function moment(date: Date | string): Moment

declare interface Moment {
    add(amount: number, unit: string): Moment
    toDate(): Date
}
