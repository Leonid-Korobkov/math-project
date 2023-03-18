// const form = document.querySelector('.converter-block');
const form = document.forms.converterForm
const resultBody = document.querySelector('.notation-result__body')
const formButton = form.button

form.addEventListener('submit', function (e) {
  e.preventDefault()
  const number = +form.number.value
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

function validationNumberInput(num) {}