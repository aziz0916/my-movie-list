const BASE_URL = 'https://movie-list.alphacamp.io'
const INDEX_URL = BASE_URL + '/api/v1/movies/'
const POSTER_URL = BASE_URL + '/posters/'
const MOVIES_PER_PAGE = 12

const movies = []
let filteredMovies = []

const dataPanel = document.querySelector('#data-panel')
const searchForm = document.querySelector('#search-form')
const searchInput = document.querySelector('#search-input')
const paginator = document.querySelector('#paginator')
const dataDisplayType = document.querySelector('#data-display-type')

// 宣告變數page的目的是讓切換card或list時，維持現有分頁
let page = 1
// 宣告變數DISPLAY_STATE的目的是列出可顯示的排列類型
const DISPLAY_STATE = {
  CardType: 'CardType',
  ListType: 'ListType'
}
// 宣告變數currentState的目的是判斷目前是處於card或list排列類型
let currentState = DISPLAY_STATE.CardType

function renderMovieCard (data) {
  let rawHTML = ''

  data.forEach((item) => {
    // title, image
    rawHTML += `<div class="col-sm-3">
          <div class="mb-2">
            <div class="card">
              <img
                src="${POSTER_URL + item.image}"
                class="card-img-top"
                alt="Movie Poster"
              />
              <div class="card-body">
                <h5 class="card-title">${item.title}</h5>
              </div>
              <div class="card-footer">
                <button
                  class="btn btn-primary btn-show-movie"
                  data-bs-toggle="modal" data-bs-target="#movie-modal" data-id="${item.id}"
                >
                  More
                </button>
                <button class="btn btn-info btn-add-favorite" data-id="${item.id}">+</button>
              </div>
            </div>
          </div>
        </div>
  `
  })
  dataPanel.innerHTML = rawHTML
}

function renderPaginator (amount) {
  const numberOfPages = Math.ceil(amount / MOVIES_PER_PAGE)
  let rawHTML = ''

  for (let page = 1; page <= numberOfPages; page++) {
    rawHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${page}">${page}</a></li>`
  }
  paginator.innerHTML = rawHTML
}

function getMoviesByPage (page) {
  const data = filteredMovies.length ? filteredMovies : movies
  const startIndex = (page - 1) * MOVIES_PER_PAGE

  return data.slice(startIndex, startIndex + MOVIES_PER_PAGE)
}

function showMovieModal (id) {
  const modalTitle = document.querySelector('#movie-modal-title')
  const modalImage = document.querySelector('#movie-modal-image')
  const modalDate = document.querySelector('#movie-modal-date')
  const modalDescription = document.querySelector('#movie-modal-description')

  axios
  .get(INDEX_URL + id)
  .then((response) => {
    const data = response.data.results
    
    modalTitle.innerText = data.title
    modalDate.innerText = 'Release date: ' + data.release_date
    modalDescription.innerText = data.description
    modalImage.innerHTML = `<img
                  src="${POSTER_URL + data.image}"
                  alt="movie-poster"
                  class="img-fluid"
                />`
  })
}

function addToFavorite (id) {
  const list = JSON.parse(localStorage.getItem('favoriteMovies')) || []
  const movie = movies.find((movie) => movie.id === id)

  if (list.some((movie) => movie.id === id)) {
    return alert('此電影已經在收藏清單中!')
  }
  list.push(movie)

  localStorage.setItem('favoriteMovies', JSON.stringify(list))
}

function renderMovieList (data) {
  let rawHTML = `<ul class="list-group mb-3">`

  data.forEach((item) => {
    rawHTML += `
    <li class="list-group-item d-flex justify-content-between align-items-center border-start-0 border-end-0">
      <div class="ms-2 me-auto">
        <div class="fw-bold">${item.title}</div>
      </div>
      <button class="btn btn-primary btn-show-movie" data-bs-toggle="modal" data-bs-target="#movie-modal" data-id="${item.id}">More</button>
      <button class="btn btn-info btn-add-favorite ms-2" data-id="${item.id}">+</button>
    </li>
    `
  })
  rawHTML += `<ul>`
  dataPanel.innerHTML = rawHTML
}

dataPanel.addEventListener('click', function onPanelClicked (event) {
  if (event.target.matches('.btn-show-movie')) {
    showMovieModal(Number(event.target.dataset.id))
  } else if (event.target.matches('.btn-add-favorite')) {
    addToFavorite(Number(event.target.dataset.id))
  }
})

paginator.addEventListener('click', function onPaginatorClicked (event) {
  if (event.target.tagName !== 'A') return

  page = Number(event.target.dataset.page)
  if (currentState === DISPLAY_STATE.CardType) {
    renderMovieCard(getMoviesByPage(page))
  } else if (currentState === DISPLAY_STATE.ListType) {
    renderMovieList(getMoviesByPage(page))
  }
})

searchForm.addEventListener('submit', function onSearchFormSubmitted (event) {
  event.preventDefault()
  const keyword = searchInput.value.trim().toLowerCase()
  
  filteredMovies = movies.filter((movie) => 
    movie.title.toLowerCase().includes(keyword)
  )

  if (filteredMovies.length === 0) {
    return alert(`您輸入的關鍵字：${keyword} 沒有符合條件的電影`)
  }
  // 每次搜尋完要讓page=1，以防如在card排列畫面的第3頁(page=3)才進行搜尋，且搜尋結果只有1頁時，card排列畫面會正常顯示搜尋結果資料，但假如此時切換到list排列畫面會造成只呈現第3頁的空資料(因為page=3)，而不是第1頁的搜尋結果資料
  page = 1
  renderPaginator(filteredMovies.length)
  if (currentState === DISPLAY_STATE.CardType) {
    renderMovieCard(getMoviesByPage(page))
  } else if (currentState === DISPLAY_STATE.ListType) {
    renderMovieList(getMoviesByPage(page))
  }
})

dataDisplayType.addEventListener('click', function onDataDisplayTypeClicked (event) {
  event.preventDefault()
  const data = filteredMovies.length ? filteredMovies : movies
  
  renderPaginator(data.length)
  if (event.target.matches('.fa-th')) {
    currentState = DISPLAY_STATE.CardType
    renderMovieCard(getMoviesByPage(page))
  } else if (event.target.matches('.fa-bars')) {
    currentState = DISPLAY_STATE.ListType
    renderMovieList(getMoviesByPage(page))
  }
})

axios
  .get(INDEX_URL)
  .then((response) => {
    movies.push(...response.data.results)
    renderPaginator(movies.length)
    renderMovieCard(getMoviesByPage(1))
  })
  .catch((err) => console.log(err))