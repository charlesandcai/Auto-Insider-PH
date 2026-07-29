const vehicleSelect = document.getElementById("vehicle");
const variantSelect = document.getElementById("variant");
const priceInput = document.getElementById("price");
const promoDPInput = document.getElementById("promoDP");
const downpayment = document.getElementById("downpayment");

// Downpayment Result

const termSelect = document.getElementById("term");

const calculateBtn = document.getElementById("calculateBtn");

const resultPrice = document.getElementById("resultPrice");
const resultDP = document.getElementById("resultDP");
const resultLoan = document.getElementById("resultLoan");
const resultMonthly = document.getElementById("resultMonthly");

const resultTerm = document.getElementById("resultTerm");

// Request Official Quotation Declaration

const quotationBtn = document.getElementById("quotationBtn");

let vehiclesData = [];

let bankRates = {};

// Load Vehicle Data

const API_URL =
"https://script.google.com/macros/s/AKfycbw5QQDBqGz8RLf0LnWIn2t4UkJ9FuQs_84nBmx6KStYzHMKKmAWIfffjVeX3Qv9Edu55A/exec";

fetch(API_URL)
    .then(response => {
        console.log("Connected to API");
        return response.json();
    })
    .then(data => {

        console.log(data);

        vehiclesData = data.map(vehicle => ({

            model: vehicle.Model,
            variant: vehicle.Variant,
            srp: Number(vehicle.SRP),

            promoDP: {
                "15": Number(vehicle["0.15"]),
                "20": Number(vehicle["0.2"]),
                "30": Number(vehicle["0.3"]),
                "40": Number(vehicle["0.4"]),
                "50": Number(vehicle["0.5"])
            },

            rates: {
                "24": Number(vehicle.Rate24),
                "36": Number(vehicle.Rate36),
                "48": Number(vehicle.Rate48),
                "60": Number(vehicle.Rate60),
                "72": Number(vehicle.Rate72)
            }

        }));

        const models = [...new Set(
            vehiclesData.map(vehicle => vehicle.model)
        )];

        models.sort();

        models.forEach(model => {

            const option = document.createElement("option");

            option.value = model;
            option.textContent = model;

            console.log(vehicleSelect);

            vehicleSelect.appendChild(option);

        });

    })
    .catch(error => console.error(error));

// TFS (2)

fetch("data/banks.json")
    .then(response => response.json())
    .then(data => {

        bankRates = data.TFS2;

    });

// Vehicle Changed

vehicleSelect.addEventListener("change", () => {

    const selectedModel = vehicleSelect.value;

    variantSelect.innerHTML =
        '<option value="">Select Variant</option>';

    priceInput.value = "";

    const variants = vehiclesData.filter(vehicle =>
        vehicle.model === selectedModel
    );

    variants.forEach(vehicle => {

        const option = document.createElement("option");

        option.value = vehicle.variant;
        option.textContent = vehicle.variant;

        variantSelect.appendChild(option);

    });

});

// Variant Changed

variantSelect.addEventListener("change", () => {

    const selectedVehicle = vehiclesData.find(vehicle =>

        vehicle.model === vehicleSelect.value &&
        vehicle.variant === variantSelect.value

    );

    if(selectedVehicle){

        priceInput.value =
            "₱ " + 
        selectedVehicle.srp.toLocaleString(undefined,{
            minimumFractionDigits:2,
            maximumFractionDigits:2
        });
        
        updatePromoDP();

    }

});

function updatePromoDP() {

    const selectedVehicle = vehiclesData.find(vehicle =>

        vehicle.model === vehicleSelect.value &&
        vehicle.variant === variantSelect.value

    );

    const selectedDP = downpayment.value;

    if (
        selectedVehicle &&
        selectedDP &&
        selectedVehicle.promoDP &&
        selectedVehicle.promoDP[selectedDP]
    ) {

        promoDPInput.value =
            "₱ " +
            selectedVehicle.promoDP[selectedDP].toLocaleString(undefined,{
                minimumFractionDigits:2,
                maximumFractionDigits:2
            });

    } else {

        promoDPInput.value = "";

    }

}

// Calculate Button

downpayment.addEventListener("change", () => {

    updatePromoDP();

});

calculateBtn.addEventListener("click", () => {

    const selectedVehicle = vehiclesData.find(vehicle =>

        vehicle.model === vehicleSelect.value &&
        vehicle.variant === variantSelect.value

    );

    if(!selectedVehicle){

        alert("Please select a vehicle.");

        return;

    }

    if(!downpayment.value){

        alert("Please select a down payment option.");

        return;

    }

    const price = selectedVehicle.srp;

    const promoDP = Number(
    selectedVehicle.promoDP[downpayment.value]
    );

// Selected DP percentage
    const dpPercent = Number(downpayment.value);

// Remaining percentage financed
    const financedPercent = 100 - dpPercent;

// Loan Amount based on Toyota computation
    const loanAmount =
    price * (financedPercent / 100);
    
    console.log({

    Price: price,

    SelectedDP: dpPercent + "%",

    PromoDP: promoDP,

    LoanAmount: loanAmount

});

    const months = termSelect.value;

    const rate = bankRates[downpayment.value][months];

    const factor = 1 + (rate / 100);

    const totalFinanced = loanAmount * factor;

    const monthlyPayment = totalFinanced / Number(months);

    resultPrice.textContent =
        "₱ " + price.toLocaleString(undefined,{
        minimumFractionDigits:2,
        maximumFractionDigits:2
        });

    resultDP.textContent =
        "₱ " + 
    promoDP.toLocaleString(undefined,{
        minimumFractionDigits:2,
        maximumFractionDigits:2
    });

    resultLoan.textContent =
    "₱ " +
    loanAmount.toLocaleString(undefined,{
        minimumFractionDigits:2,
        maximumFractionDigits:2
    });

    resultMonthly.textContent =
        "₱ " + monthlyPayment.toLocaleString(
            undefined,
            {
                minimumFractionDigits:2,
                maximumFractionDigits:2
            }
        );

    resultTerm.textContent =
    `Based on a ${months}-month term`;

});

// Request Official Quotation event listener

quotationBtn.addEventListener("click", async function (e) {

    e.preventDefault();

    const selectedVehicle =
        vehicleSelect.value + " " + variantSelect.value;

    const selectedDP =
        downpayment.value + "%";

    try {

        const formData = new URLSearchParams();

        formData.append("action", "generateQuotation");
        formData.append("vehicle", selectedVehicle);
        formData.append("downPayment", selectedDP);

        const response = await fetch(API_URL, {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (result.success) {

            window.open(result.pdfUrl, "_blank");

        } else {

            alert(result.message);

        }

    } catch (error) {

        console.error(error);

        alert("Unable to generate quotation.");

    }

});



