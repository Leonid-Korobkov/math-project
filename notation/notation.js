const errorMessage = document.querySelector('.converter-block__text_error ')
const allowedChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const form = document.forms.converterForm
const formButton = form.button
const formNumber = form.number
const formNumberFrom = form.fromNum

function addErrorMessage(base, message = `Допустимые символы: <span>${allowedChars.slice(0, base)}</span>`) {
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
  number = number.replace(' ', '')
  formNumber.value = number
  number = number.replace(/^0+/, '')
  return (
    /^[0-9a-z]*\.?[0-9a-z]*$/i.test(number) &&
    parseBigInt(number.toLowerCase(), base).toString(base).toLowerCase() === number.toString().toLowerCase()
  )
}

let prevNumberIsBase = true
function validateNumberInput(number, base) {
  const isBase = isValidate(number, base)
  // Проверка, что поле не пустое или не состоит только из нулей
  if (number.split('').every((char) => char === '0') || number === '') {
    addErrorMessage(
      base,
      `Строка не может быть пустой или состоять только из нулей!<br>Допустимые символы: <span>${allowedChars.slice(0, base)}</span>`
    )
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
  if (e.key === 'Enter' && !isValidate(formNumber.value, formNumberFrom.value)) {
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
  convertedNumber = convertFromDecToBase(decimalNumber, numberTo).result

  const svgIconCopyHtml = `
    <svg fill="" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" stroke="">
    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
    <g id="SVGRepo_iconCarrier">
      <path
        d="M13.49 3 10.74.37A1.22 1.22 0 0 0 9.86 0h-4a1.25 1.25 0 0 0-1.22 1.25v11a1.25 1.25 0 0 0 1.25 1.25h6.72a1.25 1.25 0 0 0 1.25-1.25V3.88a1.22 1.22 0 0 0-.37-.88zm-.88 9.25H5.89v-11h2.72v2.63a1.25 1.25 0 0 0 1.25 1.25h2.75zm0-8.37H9.86V1.25l2.75 2.63z">
      </path>
      <path
        d="M10.11 14.75H3.39v-11H4V2.5h-.61a1.25 1.25 0 0 0-1.25 1.25v11A1.25 1.25 0 0 0 3.39 16h6.72a1.25 1.25 0 0 0 1.25-1.25v-.63h-1.25z">
      </path>
    </g>
    </svg>
    `
  const resultHTML = `
    <div class="notation-result__title">результат:</div>
    <div class="notation-result__result-num">
        <span class="notation-result__result-num-from">${addIndexForNumber(
          groupDigits(number, numberFrom),
          `<sub class="notation-result__result-num-from-notation">${numberFrom}</sub>`
        )}</span>
        <span class="notation-result__result-sep">=</span>
        <span class="notation-result__result-num-to">${addIndexForNumber(
          groupDigits(convertedNumber, numberTo),
          `<sub class="notation-result__result-num-to-notation">${numberTo}</sub>`
        )}</span>
    </div>
    <div class="notation-result__btns">
      <button type="button" class="notation-result__btn notation-result__btn_white notation-result__btn_input-num" title="Скопировать вводное число">${svgIconCopyHtml}число</button>
      <button type="button" class="notation-result__btn notation-result__btn_output-num" title="Скопировать результат вычислений">${svgIconCopyHtml}ответ</button>
    </div>
  `
  resultBody.innerHTML = resultHTML
  resultBody.style.opacity = 1
  solutionBody.style.opacity = 1

  const resultBtns = document.querySelector('.notation-result__btns')
  resultBtns.addEventListener('click', function (e) {
    const target = e.target
    if (target.classList.contains('notation-result__btn_input-num')) {
      resultBtns.children[1].classList.remove('active')
      target.classList.add('active')
      navigator.clipboard.writeText(number)
    } else if (target.classList.contains('notation-result__btn_output-num')) {
      resultBtns.children[0].classList.remove('active')
      target.classList.add('active')
      navigator.clipboard.writeText(convertedNumber)
    } else return
    setTimeout(() => {
      target.classList.remove('active')
    }, 3000);
  })
})
formNumber.addEventListener('input', function () {
  validateNumberInput(formNumber.value, formNumberFrom.value)
})
formNumberFrom.addEventListener('change', function () {
  validateNumberInput(formNumber.value, formNumberFrom.value)
})

function convertFromBaseToDec(number, baseFrom) {
  let result = parseBigInt(number.toLowerCase(), baseFrom)
  let str = ''
  for (let i = 0; i < number.length; i++) {
    str += `${parseInt(number[i], baseFrom)}·${baseFrom}<sup>${number.length - i - 1}</sup> + `
  }
  str = str.slice(0, str.length - 2)
  let strToHTML = `
  <div class="solution-conversion__text">
    <div class="solution-conversion__title">Решение:</div>
    <div class="solution-conversion__text">
      <p class="solution-conversion__descr">Переводим <span style="color: #202020;text-transform: uppercase;">${groupDigits(
        number,
        baseFrom
      )}<sub>${baseFrom}</sub></span> в десятичную систему счисления:</p>
      <div class="solution-conversion__result-text">${groupDigits(
        number,
        baseFrom
      )}<sub>${baseFrom}</sub> = <code>${str}</code> = <span>${groupDigits(result.toString(), '10')}<sub>10</sub></span></div>
    </div>
  </div>
  `
  return {
    result,
    strToHTML
  }
}

function convertFromDecToBase(number, baseTo) {
  let str = ''
  let num = BigInt(number)
  let i = 1
  while (num > 0n) {
    let remainder = num % BigInt(baseTo)
    let remainderStr = remainder.toString(baseTo)
    str += `<li class="solution-conversion__item"><span>${i})</span><code> ${num}/${baseTo} = ${
      num / BigInt(baseTo)
    }</code>, целое число <code><span>${num - remainder}</span></code>, остаток: ${
      remainder < 10
        ? `<code><span>${remainder}</span></code>`
        : `<code>${remainder}</code>, <code>${remainder}</code> = <code><span>${remainderStr}</span></code>`
    }</li>`
    num = num / BigInt(baseTo)
    i++
  }
  let result = number.toString(baseTo)
  str += `<li class="solution-conversion__item">${number}<sub>10</sub> = <span style="color: #00bc64">${groupDigits(
    result.toString(),
    baseTo
  )}<sub>${baseTo}</span></sub></li>`
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

function groupDigits(number, base) {
  let groupSize
  switch (base) {
    case '2':
      groupSize = 8
      break
    case '10':
    case '8':
      groupSize = 3
      break
    case '16':
      groupSize = 4
      break
    default:
      return number
  }
  const digits = number.toString().split('').reverse()
  const groups = []
  let currentGroup = ''

  for (let i = 0; i < digits.length; i++) {
    currentGroup = digits[i] + currentGroup
    if ((i + 1) % groupSize === 0) {
      groups.unshift(currentGroup)
      currentGroup = ''
    }
  }

  if (currentGroup !== '') {
    groups.unshift(currentGroup)
  }

  return groups.join(' ')
}

function addIndexForNumber(number, htmlSub = '') {
  let index = 1
  let strHTML = ''
  for (let i = 0; i < number.length - 1; i++) {
    if (number[i] !== ' ') {
      strHTML += `<span>${number[i]}<span class="number-index">${i + 1}</span></span>`
    } else strHTML += number[i]
  }
  strHTML += `<span>${number[number.length - 1]}<span class="number-index">${number.length}</span>${htmlSub}</span>`
  return strHTML
}
