const form = document.forms.converterForm
const resultBody = document.querySelector('.notation-result__body')
const formButton = form.button
const errorMessage = document.querySelector('.converter-block__text_error ')
const allowedChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const formNumber = form.number
const formNumberFrom = form.fromNum

function addErrorMessage(base, message = `Допустимые символы: <span style="color: #47c527">${allowedChars.slice(0, base)}</span>`) {
  errorMessage.style.display = 'block'
  errorMessage.innerHTML = message
  formButton.style.opacity = '0.3'
  formButton.style.pointerEvents = 'none'
  formNumber.classList.add('form-input__error')
}
function removeErrorMessage() {
  errorMessage.style.display = 'none'
  formButton.style.opacity = '1'
  formButton.style.pointerEvents = 'all'
  formButton.disabled = false
  formNumber.classList.remove('form-input__error')
}

// Проверка на правильную систему счисления
function isValidate(number, base) {
  return /^[0-9a-z]*\.?[0-9a-z]*$/i.test(number) && parseInt(number, base).toString(base) === number.toString().toLowerCase()
}

let prevNumberIsBase = true
function validateNumberInput(number, base) {
  const isBase = isValidate(number, base)
  // Проверка на то, что число не больше максимально допустимого
  if (parseInt(number, base).toString(10) > Number.MAX_SAFE_INTEGER) {
    addErrorMessage(base, `Максимальное допустимое число - <span style="color: #47c527">${parseInt(Number.MAX_SAFE_INTEGER, 10).toString(base)}</span> в ${base}с/с`)
    return false
  }
  // Если предыдущая проверака на валидацию не прошла
  if (isBase === false && prevNumberIsBase === false) return false
  // Действия в зависимости от того, прошла ли проверка
  if (!isBase) {
    addErrorMessage(base)
    prevNumberIsBase = false
  } else {
    removeErrorMessage()
    prevNumberIsBase = true
  }
  return isBase
}

// Слушатели событий
form.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && !isValidate(formNumber.value.replace(/^0+/, ''), formNumberFrom.value)) {
    e.preventDefault()
  }
})
form.addEventListener('submit', function (e) {
  e.preventDefault()
  const number = formNumber.value.replace(/^0+/, '')
  const numberFrom = formNumberFrom.value
  const numberTo = form.toNum.value

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
formNumber.addEventListener('input', function () {
  validateNumberInput(formNumber.value.replace(/^0+/, ''), formNumberFrom.value)
})
formNumberFrom.addEventListener('change', function () {
  validateNumberInput(formNumber.value.replace(/^0+/, ''), formNumberFrom.value)
})