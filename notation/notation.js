const form = document.forms.converterForm
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
  return (
    /^[0-9a-z]*\.?[0-9a-z]*$/i.test(number) &&
    parseBigInt(number.toLowerCase(), base).toString(base).toLowerCase() === number.toString().toLowerCase()
  )
}

let prevNumberIsBase = true
function validateNumberInput(number, base) {
  const isBase = isValidate(number, base)
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
  const resultBody = document.querySelector('.notation-result__body')
  const solutionBody = document.querySelector('.solution-conversion__body')

  const number = formNumber.value.replace(/^0+/, '')
  const numberFrom = formNumberFrom.value
  const numberTo = form.toNum.value

  if (+numberFrom !== 10 && +numberTo === 10) {
    solutionBody.innerHTML = convertFromBaseToDec(number, numberFrom).strToHTML
  } else if (+numberFrom === 10 && +numberTo !== 10) {
    solutionBody.innerHTML = convertFromDecToBase(number, numberTo).strToHTML
  } else if (+numberFrom !== 10 && +numberTo !== 10) {
    const str =
      convertFromBaseToDec(number, numberFrom).strToHTML +
      convertFromDecToBase(convertFromBaseToDec(number, numberFrom).result, numberTo).strToHTML
    solutionBody.innerHTML = str
  } else {
    solutionBody.innerHTML = ''
  }

  const decimalNumber = convertFromBaseToDec(number, numberFrom).result
  const convertedNumber = convertFromDecToBase(decimalNumber, numberTo).result

  const resultHTML = `
    <div class="notation-result__title">результат:</div>
    <div class="notation-result__result-num">
        <span class="notation-result__result-num-from">${number}<sub class="notation-result__result-num-from-notation">${numberFrom}</sub></span>
        <span> = </span>
        <span class="notation-result__result-num-to">${convertedNumber}<sub class="notation-result__result-num-to-notation">${numberTo}</sub></span>
    </div>
  `
  resultBody.innerHTML = resultHTML
  resultBody.style.opacity = 1
  solutionBody.style.opacity = 1
})
formNumber.addEventListener('input', function () {
  validateNumberInput(formNumber.value.replace(/^0+/, ''), formNumberFrom.value)
})
formNumberFrom.addEventListener('change', function () {
  validateNumberInput(formNumber.value.replace(/^0+/, ''), formNumberFrom.value)
})

function convertFromBaseToDec(number, baseFrom) {
  let result = parseBigInt(number, baseFrom)
  let str = ''
  for (let i = 0; i < number.length; i++) {
    str += `${parseInt(number[i], baseFrom)}·${baseFrom}<sup>${number.length - i - 1}</sup> + `
  }
  str = str.slice(0, str.length - 2)
  let strToHTML = `
  <div class="solution-conversion__text">
    <div class="solution-conversion__title">Решение:</div>
    <div class="solution-conversion__text">
      <p class="solution-conversion__descr">Переводим <span style="color: #202020;text-transform: uppercase;">${number}<sub>${baseFrom}</sub></span> в десятичную систему счисления:</p>
      <div class="solution-conversion__result-text">${number}<sub>${baseFrom}</sub> = <code>${str}</code> = <span>${result}<sub>10</sub></span></div>
    </div>
  </div>
  `
  return {
    result,
    strToHTML
  }
}

function convertFromDecToBase(number, baseTo) {
  let result = ''
  let str = ''
  let num = BigInt(number)
  let i = 1
  while (num > 0n) {
    let remainder = num % BigInt(baseTo)
    let remainderStr = remainder.toString(baseTo)
    str += `<li class="solution-conversion__item"><code><span>${i})</span>${num}/${baseTo} = ${
      num / BigInt(baseTo)
    }</code>, целое число <code><span>${num - remainder}</span></code>, остаток: ${
      remainder < 10
        ? `<code><span>${remainder}</span></code>`
        : `<code>${remainder}</code>, <code>${remainder}</code> = <code><span>${remainderStr}</span></code>`
    }</li>`
    result = (num % BigInt(baseTo)).toString(baseTo) + result
    num = num / BigInt(baseTo)
    i++
  }
  str += `<li class="solution-conversion__item">${number}<sub>10</sub> = <span style="color: #00bc64">${result}<sub>${baseTo}</span></sub></li>`
  let strToHTML = `
    <div class="solution-conversion__text">
      <p class="solution-conversion__descr">Переводим целую часть ${number}<sub>10</sub> в ${baseTo}-ую систему последовательным делением на ${baseTo}:</p>
      <ul class="solution-conversion__list">
        ${str}
      </ul>
    </div>
  `
  return { result, strToHTML }
}

function parseBigInt(str, base = 10) {
  base = BigInt(base)
  let bigint = BigInt(0)
  for (let i = 0; i < str.length; i++) {
    let code = str[str.length - 1 - i].charCodeAt(0) - 48
    if (code >= 10) code -= 39
    bigint += base ** BigInt(i) * BigInt(code)
  }
  return bigint
}