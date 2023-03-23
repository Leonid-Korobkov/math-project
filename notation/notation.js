// const hexNumber = '12F.443';
// const integerPart = parseInt(hexNumber, 16).toString(2);

// const fraction = parseFloat(`0.${hexNumber.split('.')[1]}`, 16) / 16;

// let fractionalPart = '';
// let f = fraction;

// for (let i = 0; i < 16; i++) {
//   f *= 2;
//   fractionalPart += Math.floor(f).toString();
//   f -= Math.floor(f);
// }

// const binaryNumber = `${integerPart}.${fractionalPart}`;

// console.log(binaryNumber); // Output: 100101111.0100010000110000




const form = document.forms.converterForm
const resultBody = document.querySelector('.notation-result__body')
const formButton = form.button
const errorMessage = document.querySelector('.converter-block__text_error ')
const allowedChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const formNumber = form.number

function addErrorMessage(base) {
  errorMessage.style.display = 'block'
  errorMessage.innerHTML = `Допустимые символы: <span style="color: #47c527">${allowedChars.slice(0, base)}</span>`
  formButton.style.opacity = '0.3'
  formButton.style.pointerEvents = 'none'
  formNumber.classList.add('form-input__error')
}
function removeErrorMessage() {
  errorMessage.style.display = 'none'
  formButton.style.opacity = '1'
  formButton.style.pointerEvents = 'all'
  formNumber.classList.remove('form-input__error')
}
function validateNumberInput(number, base) {
  const isBase = /^[0-9a-z]*\.?[0-9a-z]*$/i.test(number) && parseInt(number, base).toString(base) === number.toString().toLowerCase()
  if (!isBase) {
    addErrorMessage(base);
  } else {
    removeErrorMessage();
  }
  return isBase
}

form.addEventListener('keydown', function (e) {
  if (!validateNumberInput(isFinite(formNumber.value) ? +formNumber.value : formNumber.value, +form.fromNum.value) && e.key === 'Enter') {
    e.preventDefault()
  }
})
form.addEventListener('submit', function (e) {
  e.preventDefault()
  const number = isFinite(formNumber.value) ? +formNumber.value : formNumber.value
  const numberFrom = +form.fromNum.value
  const numberTo = +form.toNum.value

  const decimalNumber = parseInt(number, numberFrom)
  const convertedNumber = decimalNumber.toString(numberTo)

  const stringToHtml = `
    <div class="notation-result__title">результат</div>
    <div class="notation-result__result-num">
        <span class="notation-result__result-num-from">${number}<sub class="notation-result__result-num-from-notation">${numberFrom}</sub></span>
        <span> = </span>
        <span class="notation-result__result-num-to">${convertedNumber}<sub class="notation-result__result-num-to-notation">${numberTo}</sub></span>
    </div>
    `
  resultBody.innerHTML = stringToHtml
})
formNumber.addEventListener('input', function (e) {
  validateNumberInput(isFinite(formNumber.value) ? +formNumber.value : formNumber.value, +form.fromNum.value)
})
form.fromNum.addEventListener('change', function (e) {
  validateNumberInput(isFinite(formNumber.value) ? +formNumber.value : formNumber.value, +form.fromNum.value)
})

//Альтернативный вариант валидации формы
// const allowedChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
// form.number.addEventListener('input', function (e) {
//   let value = form.number.value.toUpperCase()
//   let newValue = ''
//   let numberFrom = +form.fromNum.value;
//   for (let i = 0; i < value.length; i++) {
//     if (allowedChars.slice(0, numberFrom).indexOf(value[i]) !== -1) {
//       newValue += value[i]
//     }
//   }
//   form.number.value = newValue
// })
