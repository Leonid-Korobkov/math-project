const form = document.forms.converterForm;
const resultBody = document.querySelector('.notation-result__body');
const formButton = form.button;
const errorMessage = document.querySelector('.converter-block__text_error ');
const allowedChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const numberInput = form.number;

function addErrorMessage(base) {
  errorMessage.style.display = 'block';
  errorMessage.innerHTML = `Допустимые символы: <span style="color: #47c527">${allowedChars.slice(0, base)}</span>`;
  formButton.style.opacity = '0.3';
  formButton.style.pointerEvents = 'none';
  numberInput.classList.add('form-input__error');
}

function removeErrorMessage() {
  errorMessage.style.display = 'none';
  formButton.style.opacity = '1';
  formButton.style.pointerEvents = 'all';
  numberInput.classList.remove('form-input__error');
}

function validateNumberInput(number, base) {
  const isBase = /^[0-9a-z]*\.?[0-9a-z]*$/i.test(number) && parseFloat(number, base).toString(base) === number.toString().toLowerCase();
  if (!isBase) {
    addErrorMessage(base);
  } else {
    removeErrorMessage();
  }
  return isBase;
}

form.addEventListener('keydown', function (e) {
  if (!validateNumberInput(isFinite(numberInput.value) ? +numberInput.value : numberInput.value, +form.fromNum.value) && event.key === "Enter") {
    e.preventDefault();
  }
});

form.addEventListener('submit', function (e) {
  e.preventDefault();
  const number = isFinite(numberInput.value) ? +numberInput.value : numberInput.value;
  const numberFrom = +form.fromNum.value;
  const numberTo = +form.toNum.value;

  const decimalNumber = parseFloat(number, numberFrom);
  const convertedNumber = decimalNumber.toString(numberTo);

  const stringToHtml = `
    <div class="notation-result__title">результат</div>
    <div class="notation-result__result-num">
        <span class="notation-result__result-num-from">${number}<sub class="notation-result__result-num-from-notation">${numberFrom}</sub></span>
        <span> = </span>
        <span class="notation-result__result-num-to">${convertedNumber}<sub class="notation-result__result-num-to-notation">${numberTo}</sub></span>
    </div>
  `;
  resultBody.innerHTML = stringToHtml;
});

form.addEventListener('input', function (e) {
  if (e.target === numberInput || e.target === form.fromNum) {
    validateNumberInput(isFinite(numberInput.value) ? +numberInput.value : numberInput.value, +form.fromNum.value);
  }
});
