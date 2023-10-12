function init() {
  window.dateLocale = localStorage.getItem('locale') || undefined;

  document.querySelector('#login').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      hideLogin();
    } else {
      e.stopPropagation();
    } 
  });

  document.querySelector('#login .info a').addEventListener('click', (e) => {
    e.preventDefault();
    toggleLoginInfo();
  });

  document.querySelector('#login form').addEventListener('submit', (e) => {
    e.preventDefault();
    submitLogin();
  });

  document.querySelector('#search form').addEventListener('submit', (e) => {
    e.preventDefault();
    submitSearch();
  });

  document.querySelector('#account i').addEventListener('click', (e) => {
    if (!api.isLoggedIn) {
      toggleLogin();
    }
  });

  window.appView = new BlueskyAPI('api.bsky.app', false);
  window.api = new BlueskyAPI('bsky.social', true);

  if (api.isLoggedIn) {
    showLoggedInStatus();
  } else {
    window.api = window.appView;
  }

  parseQueryParams();
}

function parseQueryParams() {
  let params = new URLSearchParams(location.search);
  let query = params.get('q');
  let author = params.get('author');
  let post = params.get('post');

  if (query) {
    showLoader();
    loadThread(decodeURIComponent(query));
  } else if (author && post) {
    showLoader();
    loadThread(decodeURIComponent(author), decodeURIComponent(post));
  } else {
    showSearch();
  }
}

function buildParentLink(post) {
  let p = $tag('p.back');

  if (post.blocked) {
    let element = new PostComponent(post).buildElement();
    element.className = 'back';
    element.querySelector('p.blocked-header span').innerText = 'Parent post blocked';
    return element;
  } else if (post.missing) {
    p.innerHTML = `<i class="fa-solid fa-ban"></i> parent post has been deleted`;
  } else {
    let url = linkToPostThread(post);
    p.innerHTML = `<i class="fa-solid fa-reply"></i><a href="${url}">See parent post (@${post.author.handle})</a>`;
  }

  return p;
}

function showLoader() {
  $id('loader').style.display = 'block';
}

function hideLoader() {
  $id('loader').style.display = 'none';
}

function showSearch() {
  $id('search').style.visibility = 'visible';
  $id('search').querySelector('input[type=text]').focus();
}

function hideSearch() {
  $id('search').style.visibility = 'hidden';
}

function showLogin() {
  $id('login').style.visibility = 'visible';
  $id('thread').classList.add('overlay');
  $id('login_handle').focus();
}

function hideLogin() {
  $id('login').style.visibility = 'hidden';
  $id('login').classList.remove('expanded');
  $id('thread').classList.remove('overlay');
  $id('login_handle').value = '';
  $id('login_password').value = '';
}

function toggleLogin() {
  if ($id('login').style.visibility == 'visible') {
    hideLogin();
  } else {
    showLogin();
  }
}

function toggleLoginInfo(event) {
  $id('login').classList.toggle('expanded');
}

function showLoggedInStatus() {
  $id('account').innerHTML = `<i class="fa-solid fa-user-circle fa-lg"></i>`;
}

function showLoggedOutStatus() {
  $id('account').innerHTML = `<i class="fa-regular fa-user-circle fa-lg"></i>`;
}

function submitLogin() {
  let handle = $id('login_handle');
  let password = $id('login_password');
  let submit = $id('login_submit');
  let cloudy = $id('cloudy');

  if (submit.style.display == 'none') { return }

  let pds = new BlueskyAPI('bsky.social', true);

  handle.blur();
  password.blur();

  submit.style.display = 'none';
  cloudy.style.display = 'inline-block';

  pds.logIn(handle.value, password.value).then(() => {
    hideLogin();
    showLoggedInStatus();
    window.api = pds;
  }).catch((error) => {
    submit.style.display = 'inline';
    cloudy.style.display = 'none';
    console.log(error);
    alert(error);
  });
}

function submitSearch() {
  let url = $id('search').querySelector('input[name=q]').value.trim();

  if (!url) { return }

  try {
    let [handle, postId] = BlueskyAPI.parsePostURL(url);

    let newURL = linkToPostById(handle, postId);
    location.assign(newURL);
  } catch (error) {
    console.log(error);
    alert(error);
  }
}

function loadThread(url, postId, nodeToUpdate) {
  let load = postId ? api.loadThreadById(url, postId) : api.loadThreadByURL(url);

  load.then(json => {
    let root = Post.parse(json.thread);
    window.root = root;

    if (root.parent && !nodeToUpdate) {
      let p = buildParentLink(root.parent);
      $id('thread').appendChild(p);
    }

    let list = new PostComponent(root).buildElement();
    hideLoader();

    if (nodeToUpdate) {
      nodeToUpdate.querySelector('.content').replaceWith(list.querySelector('.content'));
    } else {
      $id('thread').appendChild(list);
    }
  }).catch(error => {
    hideLoader();
    console.log(error);
    alert(error);
  });
}
