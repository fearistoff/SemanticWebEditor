"use strict";

let createNewButton = document.querySelector("#new-sem-item");
let workspace = document.querySelector("#workspace");
let i = 1;
let selectedItem = {};
let bnwButton = document.querySelector("#bnw");
let blackTheme = true;
let selectedCTRL;
let selectedLMB;
let listOfSemanticItems = [];
let nemItem;

class SemanticItem {
	constructor(DOMelement, header) {
		this.DOMelement = DOMelement;
		this.header = header;
	}
}

bnwButton.addEventListener("click", function() {
	if (!blackTheme) {
		blackTheme = true;
		bnwButton.innerHTML = "Светлая тема";
		if (document.querySelector(".semantic-item")) {
			document.querySelectorAll(".semantic-item").forEach(function(item) {
				item.classList.add('black');
				item.classList.remove('white');
			});
		}
		document.querySelector("#workspace").classList.add('black');
		document.querySelector("#workspace").classList.remove('white');
		document.querySelector("#tools").classList.add('black');
		document.querySelector("#tools").classList.remove('white');
		document.querySelector("#bnw.white").classList.add('black');
		document.querySelector("#bnw.white").classList.remove('white');
		document.querySelector("body").classList.add('black');
		document.querySelector("body").classList.remove('white');
		document.querySelector(".button").classList.add('black');
		document.querySelector(".button").classList.remove('white');

	} else {
		blackTheme = false;
		bnwButton.innerHTML = "Тёмная тема";
		if (document.querySelector(".semantic-item")) {
			document.querySelectorAll(".semantic-item").forEach(function(item) {
				item.classList.add('white');
				item.classList.remove('black');
			});
		}
		document.querySelector("#workspace").classList.add('white');
		document.querySelector("#workspace").classList.remove('black');
		document.querySelector("#tools").classList.add('white');
		document.querySelector("#tools").classList.remove('black');
		document.querySelector("#bnw.black").classList.add('white');
		document.querySelector("#bnw.black").classList.remove('black');
		document.querySelector("body").classList.add('white');
		document.querySelector("body").classList.remove('black');
		document.querySelector(".button").classList.add('white');
		document.querySelector(".button").classList.remove('black');
	}
})

function getCoords(avatar) {
	let coords = {
		left: '',
		top: ''
	}
	coords.top = parseInt(avatar.style.top);
	coords.left = parseInt(avatar.style.left);
	return coords;
}

function createAvatar(e) {
  // запомнить старые свойства, чтобы вернуться к ним при отмене переноса
  let avatar = selectedItem.elem;
  let old = {
    parent: avatar.parentNode,
    nextSibling: avatar.nextSibling,
    left: avatar.left,
    top: avatar.top
  };

  // функция для отмены переноса
  avatar.rollback = function() {
    old.parent.insertBefore(avatar, old.nextSibling);
    avatar.style.left = old.left;
    avatar.style.top = old.top;
  };

  return avatar;
}

function startDrag(e) {
  let avatar = selectedItem.avatar;

  document.querySelector("#workspace").appendChild(avatar);
}

document.onmousedown = function(e) {
	if (e.which != 1) {
		return;
	}

	let elem = e.target.closest(".semantic-item");

	if (!elem) {
		if (selectedCTRL) {
			selectedCTRL.classList.remove('selected-ctrl');
			selectedCTRL = null;
		}
		if (selectedLMB) {
			selectedLMB.classList.remove('selected-lmb');
			selectedLMB = null;
		}
		return;
	}

	//попытаться реализовать двойной выбор
	if (window.event.ctrlKey) {
		if (selectedCTRL) {
			selectedCTRL.classList.remove('selected-ctrl');
		}
		selectedCTRL = elem;
		selectedCTRL.classList.add('selected-ctrl');
		if (selectedCTRL.classList.contains("selected-lmb")) {
			selectedLMB = null;
			selectedCTRL.classList.remove("selected-lmb")
		}
	} else {
		if (selectedLMB) {
			selectedLMB.classList.remove('selected-lmb');
		}
		selectedLMB = elem;
		selectedLMB.classList.add('selected-lmb');
		if (selectedLMB.classList.contains("selected-ctrl")) {
			selectedCTRL = null;
			selectedLMB.classList.remove("selected-ctrl")
		}
	}

	selectedItem.elem = elem;
	selectedItem.downX = e.pageX;
	selectedItem.downY = e.pageY;
}

document.onmousemove = function(e) {
	if (!selectedItem.elem) {
		return;
	}

	if (!selectedItem.avatar) {
		let moveX = e.pageX - selectedItem.downX;
		let moveY = e.pageY - selectedItem.downY;

		selectedItem.avatar = createAvatar(e);

		if (!selectedItem.avatar) {
			selectedItem = {};
			return;
		}
		let coords = getCoords(selectedItem.avatar);
			selectedItem.shiftX = selectedItem.downX - coords.left;
			selectedItem.shiftY = selectedItem.downY - coords.top;
			startDrag(e);
	}

	selectedItem.avatar.style.left = e.pageX - selectedItem.shiftX + 'px';
	selectedItem.avatar.style.top = e.pageY - selectedItem.shiftY + 'px';

	return false;
}

document.onmouseup = function(e) {
  // (1) обработать перенос, если он идет (опционально)
  // if (selectedItem.avatar) {
  //   finishDrag(e);
  // }

  // в конце mouseup перенос либо завершился, либо даже не начинался
  // (2) в любом случае очистим "состояние переноса" selectedItem
  selectedItem = {};
}

createNewButton.addEventListener("click", function () {
	workspace.innerHTML += '<div id="s' + i + '" class="semantic-item "></div>';
	nemItem = document.querySelector("#s" + i);
	nemItem.classList.add(blackTheme ? "black" : "white");
	nemItem.style.top = i*10 + "px";
	nemItem.style.left = i*10 + "px";
	nemItem.innerHTML = '<h2>id="s' + i + '"</h2>';

	listOfSemanticItems[i] = new SemanticItem(nemItem, 'id="s' + i + '"');
	i++;
});