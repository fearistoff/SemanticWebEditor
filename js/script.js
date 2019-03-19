"use strict";

function upadteLength(array) {
	array.sort();
	let i = 0;
	array.forEach(function() {
		i++;
	});
	array.length = i;
}

class SemanticConnection {
	constructor(semanticItemA, semanticItemB, typeOfConnection) {
		this._semanticItemA = semanticItemA;
		this._semanticItemB = semanticItemB;
		this.typeOfConnection = typeOfConnection;
		this.topA = semanticItemA.getTop();
		this.leftA = semanticItemA.getLeft();
		this.topB = semanticItemB.getTop();
		this.leftB = semanticItemB.getLeft();
		this.idA = semanticItemA.getDOM().id;
		this.idB = semanticItemB.getDOM().id;
	}

	getIds = function() {
		return [this.idA, this.idB];
	}
}

class SemanticItem {
	constructor(DOMelement) {
		this._DOMelement = DOMelement;
	}

	data = {
		header: ""
	};

	getTop = function() {
		return document.querySelector("#" + this._DOMelement).style.top;		
	}

	getLeft = function() {
		return document.querySelector("#" + this._DOMelement).style.left;
	}

	getDOM = function() {
		if (this._DOMelement) {
			return document.querySelector("#" + this._DOMelement);
		}
		return false;
	}

	getData = function(name) {
		return this.data[name];
	}

	setData = function(name, value) {
		this.data[name] = value;
	}

	setDOM = function(DOMin) {
		this._DOMelement = DOMin;
	}
}

let createNewButton = document.querySelector("#new-sem-item");
let deleteButton = document.querySelector("#delete-sem-item");
let connectButton = document.querySelector("#connect-sem-item");
let editButton = document.querySelector("#edit-sem-item");
let workspace = document.querySelector("#workspace");
let darkBackground = document.querySelector(".dark-background");
let i = 0;
let j = 0;
let selectedItem = {};
let bnwButton = document.querySelector("#bnw");
let blackTheme = true;
let settingItem = false;
let selectedCTRL = new SemanticItem(null);
let selectedLMB = new SemanticItem(null);
let listOfSemanticConnections = [];
let listOfSemanticItems = [];
let nemItem;
let changeIdentificator;
let canvas = document.querySelector("canvas");
let context = canvas.getContext("2d");

function makeConnection(j, itemA, itemB, type) {
	if (itemA.getDOM() && itemB.getDOM()) {
		listOfSemanticConnections[j] = new SemanticConnection(itemA, itemB, type);
	} else {
		alert("Не выделены объекты!");
	}
}

function createSemanticItem(i, data) {
	workspace.innerHTML += '<div id="s' + i + '" class="semantic-item"></div>';
	nemItem = document.querySelector("#s" + i);
	listOfSemanticItems[i] = new SemanticItem(nemItem.id);
	nemItem.style.top = (i+1)*10 + "px";
	listOfSemanticItems[i].setData("top" , (i+1)*10);
	nemItem.style.left = (i+1)*10 + "px";
	listOfSemanticItems[i].setData("left" , (i+1)*10);
	nemItem.innerHTML = '<h2>' + data["header"] + '</h2>';
	for (let key in data) {
	  listOfSemanticItems[i].setData(key, data[key]);
	}
	listOfSemanticItems[i].setData("header" , data["header"]);
}

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

function updateEverything() {
	listOfSemanticConnections.forEach(function(item) {
		item.topA = document.querySelector("#" + item.idA).style.top;
		item.leftA = document.querySelector("#" + item.idA).style.left;
		item.topB = document.querySelector("#" + item.idB).style.top;
		item.leftB = document.querySelector("#" + item.idB).style.left;
	});
	listOfSemanticItems.forEach(function(item) {
		item.data.top = document.querySelector("#" + item._DOMelement).style.top;
		item.data.left = document.querySelector("#" + item._DOMelement).style.left;
	});
	upadteLength(listOfSemanticConnections);
	upadteLength(listOfSemanticItems);
	updateLines();
	adaptivePanel();
}

function updateLines() {
	context.clearRect(0, 0, canvas.width, canvas.height);
	context.beginPath();
	context.font = "12px Consolas";
	context.textAlign = "left";
	context.textBaseline = "hanging";
	if (blackTheme) {
		context.strokeStyle = "#e1e1e1";
	} else {
		context.strokeStyle = "#191919";
	}
	context.clearRect(0, 0, canvas.width, canvas.height);
	listOfSemanticConnections.forEach(function(item) {
		context.moveTo(parseInt(item.leftA) + 15, parseInt(item.topA) + 15);
		context.lineTo(parseInt(item.leftB) + 15, parseInt(item.topB) + 15);
	});
	context.stroke();
	if (blackTheme) {
		context.fillStyle = "#e1e1e1";
	} else {
		context.fillStyle = "#191919";
	}
	listOfSemanticConnections.forEach(function(item) {
		context.fillRect((parseInt(item.leftA) + parseInt(item.leftB))/2 + 14, (parseInt(item.topA) + parseInt(item.topB))/2 + 15, item.typeOfConnection.length*6.6 + 2, 14);
	});
	if (blackTheme) {
		context.fillStyle = "#191919";
	} else {
		context.fillStyle = "#e1e1e1";
	}
	context.stroke();
	listOfSemanticConnections.forEach(function(item) {
		context.fillText(item.typeOfConnection, (parseInt(item.leftA) + parseInt(item.leftB))/2 + 15, (parseInt(item.topA) + parseInt(item.topB))/2 + 17);
	});
}

function deleteSemanticItem(semanticItemToDelete) {	
	let indexes = [];
	let k = 0;
	listOfSemanticItems.forEach(function(item, index) {
		if (semanticItemToDelete._DOMelement == item._DOMelement) {
			if (listOfSemanticConnections.length) {
				listOfSemanticConnections.forEach(function(item2, index2) {
					if (item2.getIds().includes(semanticItemToDelete._DOMelement)) {
						delete listOfSemanticConnections[index2];
					}
				})
			}
			listOfSemanticItems.splice(index, 1);
		}
	});
	document.querySelector('#' + semanticItemToDelete._DOMelement).remove();
}

function adaptivePanel() {
	document.querySelector("#main-container").style.height = (parseInt(window.innerHeight) - 85) + "px";
	let itemPanel = document.querySelector(".item-panel");
	let height = document.querySelector(".item-panel").offsetHeight;
	let width = document.querySelector(".item-panel").offsetWidth;
	document.querySelector(".item-panel").style.top = (window.innerHeight/2 - height/2) + "px";
	document.querySelector(".item-panel").style.left = (window.innerWidth/2 - width/2) + "px";
}

window.addEventListener('resize', function(event){
  adaptivePanel();
});

updateEverything();

bnwButton.addEventListener("click", function() {
	if (!blackTheme) {
		blackTheme = true;
		bnwButton.innerHTML = "Светлая тема";
		document.querySelector("body").classList.add('black');
		document.querySelector("body").classList.remove('white');

		// if (document.querySelector(".semantic-item")) {
		// 	document.querySelectorAll(".semantic-item").forEach(function(item) {
		// 		item.classList.add('black');
		// 		item.classList.remove('white');
		// 	});
		// }
		// document.querySelector("#workspace").classList.add('black');
		// document.querySelector("#workspace").classList.remove('white');
		// document.querySelector("#tools").classList.add('black');
		// document.querySelector("#tools").classList.remove('white');
		// document.querySelector("#bnw.white").classList.add('black');
		// document.querySelector("#bnw.white").classList.remove('white');
		// document.querySelector("body").classList.add('black');
		// document.querySelector("body").classList.remove('white');
		// document.querySelector(".item-panel").classList.add('black');
		// document.querySelector(".item-panel").classList.remove('white');
		// document.querySelector(".data-header").classList.add('black');
		// document.querySelector(".data-header").classList.remove('white');
		// if (document.querySelector(".data-index")) {
		// 	document.querySelectorAll(".data-index").forEach(function(item) {
		// 		item.classList.add('black');
		// 		item.classList.remove('white');
		// 	});
		// }
		// document.querySelectorAll(".button").forEach(function(item) {
		// 	item.classList.add('black');
		// 	item.classList.remove('white');
		// });
	} else {
		blackTheme = false;
		bnwButton.innerHTML = "Тёмная тема";
		document.querySelector("body").classList.add('white');
		document.querySelector("body").classList.remove('black');
		// if (document.querySelector(".semantic-item")) {
		// 	document.querySelectorAll(".semantic-item").forEach(function(item) {
		// 		item.classList.add('white');
		// 		item.classList.remove('black');
		// 	});
		// }
		// if (document.querySelector(".data-index")) {
		// 	document.querySelectorAll(".data-index").forEach(function(item) {
		// 		item.classList.add('white');
		// 		item.classList.remove('black');
		// 	});
		// }
		// document.querySelector(".data-header").classList.add('white');
		// document.querySelector(".data-header").classList.remove('black');
		// document.querySelector("#workspace").classList.add('white');
		// document.querySelector("#workspace").classList.remove('black');
		// document.querySelector("#tools").classList.add('white');
		// document.querySelector("#tools").classList.remove('black');
		// document.querySelector("#bnw.black").classList.add('white');
		// document.querySelector("#bnw.black").classList.remove('black');
		// document.querySelector("body").classList.add('white');
		// document.querySelector("body").classList.remove('black');
		// document.querySelector(".item-panel").classList.add('white');
		// document.querySelector(".item-panel").classList.remove('black');
		// document.querySelectorAll(".button").forEach(function(item) {
		// 	item.classList.add('white');
		// 	item.classList.remove('black');
		// });
	}
	updateEverything();
})

document.onkeyup = function(e) {
	if (e.keyCode == 46) {
		deleteSemanticItem(selectedLMB);
	}
	if (e.keyCode == 27 && settingItem) {
		hideEditWindow();
	}
	updateEverything();
}

document.onmousedown = function(e) {
	if (e.which != 1) {
		return;
	}

	let elem = e.target;
	if ((elem == document.querySelector("canvas") || elem != e.target.closest(".semantic-item")) && elem.parentElement != e.target.closest(".semantic-item"))  {
		if (elem == document.querySelector("canvas")) {
			if (selectedCTRL.getDOM()) {
				selectedCTRL.getDOM().classList.remove('selected-ctrl');
				selectedCTRL.setDOM(null);
			}
			if (selectedLMB.getDOM()) {
				selectedLMB.getDOM().classList.remove('selected-lmb');
				selectedLMB.setDOM(null);
			}
		}
		return;
	} else if (elem.parentElement == e.target.closest(".semantic-item")) {
		elem = elem.parentElement;
	}

	if (window.event.ctrlKey) {
		if (selectedCTRL.getDOM()) {
			selectedCTRL.getDOM().classList.remove('selected-ctrl');
		}
		selectedCTRL.setDOM(elem.id);
		selectedCTRL.getDOM().classList.add('selected-ctrl');
		if (selectedCTRL.getDOM().classList.contains("selected-lmb")) {
			selectedLMB.setDOM(null);
			selectedCTRL.getDOM().classList.remove("selected-lmb")
		}
	} else {
		if (selectedLMB.getDOM()) {
			selectedLMB.getDOM().classList.remove('selected-lmb');
		}
		selectedLMB.setDOM(elem.id);
		selectedLMB.getDOM().classList.add('selected-lmb');
		if (selectedLMB.getDOM().classList.contains("selected-ctrl")) {
			selectedCTRL.setDOM(null);
			selectedLMB.getDOM().classList.remove("selected-ctrl")
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

	if (window.event.ctrlKey) {
		selectedCTRL.setData("top", selectedItem.avatar.style.top);
		selectedCTRL.setData("left", selectedItem.avatar.style.left);
	} else {
		selectedLMB.setData("top", selectedItem.avatar.style.top);
		selectedLMB.setData("left", selectedItem.avatar.style.left);
	}
	updateEverything();
}

document.onmouseup = function(e) {
  if (selectedItem.avatar) {
  	if (window.event.ctrlKey) {
  		selectedCTRL.setData("top" , selectedItem.avatar.style.top);
			selectedCTRL.setData("left" , selectedItem.avatar.style.left);
  	} else {
  		selectedLMB.setData("top" , selectedItem.avatar.style.top);
			selectedLMB.setData("left" , selectedItem.avatar.style.left);
  	}
  }

  selectedItem = {};
}

deleteButton.addEventListener("click", function() {
	deleteSemanticItem(selectedLMB);	
	updateEverything();
});

connectButton.addEventListener("click", function() {
	makeConnection(j, selectedLMB, selectedCTRL, "test");
	j++;
	updateEverything();
});

createNewButton.addEventListener("click", function () {
	let tempData = {
		header: "Yes!",
		test1: "hope this will work...",
		int: 123,
		binary: false
	}
	createSemanticItem(i, tempData)
	//document.querySelector(".item-panel").innerHTML = 
	//appearEditWindow();
	i++;
	settingItem = true;
	updateEverything();
});

function appearEditWindow() {
	document.querySelector(".item-panel").style.display = "block";
	document.querySelector(".dark-background").style.display = "block";
	updateEverything();
	setTimeout(function() {
		document.querySelector(".dark-background").style.backgroundColor = "rgba(0,0,0, 0.5)";
		if (blackTheme) {
			document.querySelector(".item-panel").style.borderColor = "rgba(55,0,115,1)";
			document.querySelector(".item-panel").style.backgroundColor = "rgba(50,50,50, 1)";
		} else {
			document.querySelector(".item-panel").style.borderColor = "rgba(85,255,85,1)";
			document.querySelector(".item-panel").style.backgroundColor = "rgba(225,225,225, 1)";
		}
	}, 50);
	setTimeout(function() {
		if (blackTheme) {





			document.querySelectorAll(".item-panel .button").forEach(function(item) {
				item.style.backgroundColor = "rgba(62, 0, 129, 1)";
				item.style.color = "rgba(183, 117, 255, 1)";
			});





			document.querySelector(".data-header").style.backgroundColor = "rgba(50,50,50, 1)";
			document.querySelector(".data-header").style.color = "rgba(225,225,225, 1)";
		} else {
			document.querySelectorAll(".item-panel .button").forEach(function(item) {
				item.style.backgroundColor = "rgba(136, 255, 136, 1)";
				item.style.color = "rgba(0, 153, 0, 1)";
			});
			document.querySelector(".data-header").style.backgroundColor = "rgba(225,225,225, 1)";
			document.querySelector(".data-header").style.color = "rgba(50,50,50, 1)";
		}
		document.querySelectorAll(".item-panel li").forEach(function(item) {
			item.style.color = "rgba(225, 225, 225, 1)";
		});
		document.querySelectorAll(".data-value").forEach(function(item) {
			item.style.color = "rgba(50,50,50,1)";
  		item.style.borderColor = "rgba(102,102,102,1)";
			item.style.backgroundColor = "rgba(225, 225, 225, 1)";
		})
		document.querySelectorAll(".data-index").forEach(function(item) {
			item.style.borderColor = "rgba(102,102,102, 1)";
			if (blackTheme) {
				item.style.color = "rgba(225,225,225, 1)";
				item.style.backgroundColor = "rgba(50,50,50, 1)";
			} else {
				item.style.color = "rgba(50,50,50, 1)";
				item.style.backgroundColor = "rgba(225,225,225, 1)";
			}
			 
		});
		document.querySelector(".item-panel h2").style.borderBottomColor = "rgba(102,102,102, 1)";
		document.querySelector(".data-header").style.borderColor = "rgba(102,102,102, 1)";
	}, 300);
}

function hideEditWindow() {
	document.querySelector(".data-header").style.backgroundColor = "";
	document.querySelector(".data-header").style.color = "";
	document.querySelector(".data-header").style.borderColor = "";
	document.querySelector(".item-panel h2").style.borderBottomColor = "";
	document.querySelectorAll(".data-index").forEach(function(item) {
		item.style.borderColor = "";
		item.style.color = "";
		item.style.backgroundColor = "";
	});
	document.querySelectorAll(".data-value").forEach(function(item) {
		item.style.borderColor = "";
		item.style.color = "";
		item.style.backgroundColor = "";
	});
	document.querySelectorAll(".item-panel .button").forEach(function(item) {
		item.style.backgroundColor = "";
		item.style.color = "";
	});
	document.querySelectorAll(".item-panel li").forEach(function(item) {
		item.style.color = "";
	}); 
	setTimeout(function() {
		document.querySelector(".dark-background").style.backgroundColor = "";
		document.querySelector(".item-panel").style.borderColor = "";
		document.querySelector(".item-panel").style.backgroundColor = "";
		// document.querySelector(".item-panel").innerHTML = "";
	}, 300);
	
	setTimeout(function() {
		document.querySelector(".item-panel").style.transform = "";
		document.querySelector(".item-panel").style.display = "";
		document.querySelector(".dark-background").style.display = "";
		document.querySelector(".item-panel").innerHTML = "";
	}, 550);
}

darkBackground.addEventListener("click", function() {
	settingItem = false;
	hideEditWindow();
})

function prepareWindow(prepSemanticItem) {
	switch (changeIdentificator) {
		case "edit":
			for (let key in prepSemanticItem.data) {
				if (key == "header") {
					document.querySelector(".item-panel").innerHTML += '<h2><input class="data-header" type="text" value="' + prepSemanticItem.data[key] + '"></h2><ul class="data-list">';
				} else {
					document.querySelector(".item-panel ul").innerHTML += '<li><input class="data-index" type="text" value="' + key + '"><input type="text" class="data-value" value="' + prepSemanticItem.data[key] + '"><div id="sem-data-delete" class="button"><i class="fas fa-minus"></i><span>Удалить свойство</span></div></li>';
				}
			}
			document.querySelector(".item-panel").innerHTML += '</ul><div class="button-place"><div id="new-sem-item-data" class="button"><i class="fas fa-plus"></i><span>Добавить&nbspсвойство</span></div><div id="sem-done" class="button"><i class="fas fa-check"></i><span>Применить</span></div></div>';
			break;
		case "create":

			break;
		case "connect":

			break;
		case "delete":

			break;
		default:

	}
}

function findSelected(which) {
	let target = null;
	if (which == "LMB") {
		listOfSemanticItems.forEach(function(item) {
			if (selectedLMB._DOMelement == item._DOMelement) {
				target = item;
			}
		});
	} else if (which == "CTRL") {
		listOfSemanticItems.forEach(function(item) {
			if (selectedCTRL._DOMelement == item._DOMelement) {
				return item;
			}
		});
	}
	return target;
}

editButton.addEventListener("click", function() {
	if (selectedLMB.getDOM()) {
		changeIdentificator = "edit";
		prepareWindow(findSelected("LMB"));
		settingItem = true;
		appearEditWindow();
	} else {
		alert("Не выбран элемент!")
	}
})

