const form = document.forms.converterForm
const resultBody = document.querySelector('.notation-result__body')
const formButton = form.button
const errorMessage = document.querySelector('.converter-block__text_error ')
const allowedChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function addErrorMessege(base) {
  errorMessage.style.display = 'block'
  errorMessage.innerHTML = `Допустимые символы: <span style="color: #47c527">${allowedChars.slice(0, base)}</span>`
  formButton.style.opacity = '0.3'
  formButton.style.pointerEvents = 'none'
  form.number.style.cssText = `
    outline: 1px solid #ff2c2c;
    -webkit-box-shadow: 1px 0px 38px 0px rgba(255, 44, 44, 0.73); 
    -moz-box-shadow: 1px 0px 38px 0px rgba(255, 44, 44, 0.73); 
    box-shadow: 1px 0px 38px 0px rgba(255, 44, 44, 0.73);
  `
}
function removeErrorMessege() {
  errorMessage.style.display = 'none'
  formButton.style.opacity = '1'
  formButton.style.pointerEvents = 'all'
  // form.number.style.cssText = `
  //   outline: none;
  //   -webkit-box-shadow: none;
  //   -moz-box-shadow: none;
  //   box-shadow: none;
  // `
}
function validateNumberInput(number, base) {
  const isBase = /^[0-9a-z]+$/i.test(number) && parseInt(number, base).toString(base) === number.toString().toLowerCase()
  if (!isBase) addErrorMessege(base)
  else removeErrorMessege()
}

form.addEventListener('submit', function (e) {
  e.preventDefault()
  const number = isFinite(form.number.value) ? +form.number.value : form.number.value
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

form.number.addEventListener('input', function (e) {
  validateNumberInput(isFinite(form.number.value) ? +form.number.value : form.number.value, +form.fromNum.value)
})

form.fromNum.addEventListener('change', function (e) {
  validateNumberInput(isFinite(form.number.value) ? +form.number.value : form.number.value, +form.fromNum.value)
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
