"use strict";

class SemanticConnection {		//Класс семантических связей
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
	
	getIds = function() {		//вывод связанных элементов 
		return [this.idA, this.idB];
	}
}

class SemanticItem {		//Класс семантических элементов
	constructor(DOMelement) {
		this._DOMelement = DOMelement;
	}

	data = {
		header: ""
	};
	
	getTop = function() {		//Возврат фактического положения по вертикали элемента на рабочем поле
		return document.querySelector("#" + this._DOMelement).style.top;		
	}
	
	getLeft = function() {		//Возврат фактического положения по горизонтали элемента на рабочем поле
		return document.querySelector("#" + this._DOMelement).style.left;
	}
	
	getDOM = function() {		//Возврат элемента на рабочем поле
		if (this._DOMelement) {
			return document.querySelector("#" + this._DOMelement);
		}
		return false;
	}
	
	getData = function(name) {		//Возврат некоторого свойства элемента
		return this.data[name];
	}
	
	setData = function(name, value) {		//Задание некоторого свойства элемента
		this.data[name] = value;
	}
	
	setDOM = function(DOMin) {		//Задание элемента на рабочем поле
		this._DOMelement = DOMin;
	}
}

let createNewButton = document.querySelector("#new-sem-item");					//кнопка создания нового семантического элемента
let deleteButton = document.querySelector("#delete-sem-item");					//кнопка удаления семантического объекта
let connectButton = document.querySelector("#connect-sem-item");				//кнопка создания семантической связи
let editButton = document.querySelector("#edit-sem-item");							//кнопка редактирования семантического объекта
let workspace = document.querySelector("#workspace");										//рабочее поле
let bnwButton = document.querySelector("#bnw");													//кнопка смены оформления интерфейса
let darkBackground = document.querySelector(".dark-background");				//область затемнения фона при уведомлениях/окнах редактирования/создания объектов
let rightItemButton = document.querySelector("#items-r");								//кнопка отображения списка элементов
let rightConnectionsButton = document.querySelector("#connections-r");	//кнопка отображения списка связей
let canvas = document.querySelector("canvas");													//поле отрисовки линий и печати семантики связей
let context = canvas.getContext("2d");																	//двумерный контекст поля отрисовки
let selectedConnection;																									//выбранное соединение
let itemsCreateCounter = 0;																							//счётчик созданных элементов
let connectionsCreateCounter = 0;																				//счётчик созданных связей
let selectedItem = {};																									//выбранный элемент при перемещении
let blackTheme = true;																									//выбранная тема оформления интерфейса
let selectedItemsView = true;																						//выбранный тип, отображаемый в списке объектов
let selectedLMB = new SemanticItem(null);																//первый выбранный элемент/связь
let selectedCTRL = new SemanticItem(null);															//второй выбранный элемент 
let listOfSemanticConnections = [];																			//список связей
let listOfSemanticItems = [];																						//список элементов
let changeIdentificator;																								//идентификатор характера редактирования

function upadteLength(array) {		//Пересчёт и группировка массива. Необходим при удалении элементов
	array.sort();
	let i = 0;
	array.forEach(function() {
		i++;
	});
	array.length = i;
}

function makeConnection(j, itemA, itemB, type) {		//функция создания связи
	if (itemA.getDOM() && itemB.getDOM()) {		//проверка выделения двух элементов
		listOfSemanticConnections[j] = new SemanticConnection(itemA, itemB, type);
	} else {
		alert("Не выделены объекты!");
	}
}

function createSemanticItem(i, data) {		//функция создания элемента
	let nemItem;
	workspace.innerHTML += '<div id="s' + i + '" class="semantic-item"></div>';
	nemItem = document.querySelector("#s" + i);
	listOfSemanticItems[i] = new SemanticItem(nemItem.id);
	nemItem.style.top = (i+1)*10 + "px";
	listOfSemanticItems[i].setData("top" , (i+1)*10);
	nemItem.style.left = (i+1)*10 + "px";
	listOfSemanticItems[i].setData("left" , (i+1)*10);
	nemItem.innerHTML = '<h2>' + data["header"] + '</h2>';
	nemItem.innerHTML += '<ul></ul>';
	for (let key in data) {
	  listOfSemanticItems[i].setData(key, data[key]);
	  if (key != "header") {
	  	document.querySelector("#s" + i + " ul").innerHTML += "<li>" + key + ": " + data[key] + "</li>";
	  }
	}
	listOfSemanticItems[i].setData("header" , data["header"]);
}

function getCoords(avatar) {		//функция получения координат при перемещении
	let coords = {
		left: '',
		top: ''
	}
	coords.top = parseInt(avatar.style.top);
	coords.left = parseInt(avatar.style.left);
	return coords;
}

function startDrag(e) {		//функция создания копии для перемещения
  let avatar = selectedItem.avatar;
  document.querySelector("#workspace").appendChild(avatar);
}

function updateEverything() {		//функция обновления отображения семантических объектов и элементов интерфейса
	listOfSemanticConnections.forEach(function(item) {		//обновление текущих координат соединений
		item.topA = document.querySelector("#" + item.idA).style.top;
		item.leftA = document.querySelector("#" + item.idA).style.left;
		item.topB = document.querySelector("#" + item.idB).style.top;
		item.leftB = document.querySelector("#" + item.idB).style.left;
	});
	listOfSemanticItems.forEach(function(item) {		//обновление текущих координат элементов
		item.data.top = document.querySelector("#" + item._DOMelement).style.top;
		item.data.left = document.querySelector("#" + item._DOMelement).style.left;
	});
	upadteLength(listOfSemanticConnections);
	upadteLength(listOfSemanticItems);
	refreshItemInfo();
	updateLines();
	adaptivePanel();
	checkList();
}

function updateLines() {		//функция отрисовки/обновления линий и подписей связей
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

function deleteSemanticItem(semanticItemToDelete) {		//функция удаления объекта
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
	//сделать удаление связей
}

function adaptivePanel() {		//функция обновления позиционирования окна создания/редактирования
	document.querySelector("#main-container").style.height = (parseInt(window.innerHeight) - 85) + "px";
	let itemPanel = document.querySelector(".item-panel");
	let height = document.querySelector(".item-panel").offsetHeight;
	let width = document.querySelector(".item-panel").offsetWidth;
	document.querySelector(".item-panel").style.top = (window.innerHeight/2 - height/2) + "px";
	document.querySelector(".item-panel").style.left = 115 + "px";
	document.querySelector("#items-list").style.height = (document.querySelector("#items").offsetHeight - 55) + "px";
}

function refreshItemInfo() {		//функция обновления подиспей заголовков и свойство элементов
	listOfSemanticItems.forEach(function(item) {
		document.querySelector("#" + item._DOMelement + " h2").innerHTML = item.data["header"];
		document.querySelector("#" + item._DOMelement + " ul").innerHTML = "";
		for (let key in item.data) {
			if (key != "top" && key != "left" && key != "header") {
				document.querySelector("#" + item._DOMelement + " ul").innerHTML += "<li>" + key + ": " + item.data[key] + "</li>";
			}
		}
	})
}

window.addEventListener('resize', function(event){		//обновление позиционирования окна при изменении ширины окна браузера
  adaptivePanel();
});

updateEverything();

bnwButton.addEventListener("click", function() {		//смена оформления интерфейса
	if (!blackTheme) {
		blackTheme = true;
		bnwButton.innerHTML = "Светлая тема";
		document.querySelector("body").classList.add('black');
		document.querySelector("body").classList.remove('white');
	} else {
		blackTheme = false;
		bnwButton.innerHTML = "Тёмная тема";
		document.querySelector("body").classList.add('white');
		document.querySelector("body").classList.remove('black');
	}
	updateEverything();
})

document.onkeyup = function(e) {		//обработка нажатия клавиш
	if (e.keyCode == 46) {
		deleteSemanticItem(selectedLMB);
	}
	if (e.keyCode == 27) {
		hideEditWindow();
	}
	updateEverything();
}

document.querySelector("#ws").onmousedown = function(e) {		//начало перетаскивания элементов (нажатие ЛКМ)
	if (e.which != 1) {
		return;
	}

	let elem = e.target;
	if ((elem == document.querySelector("canvas") || elem != e.target.closest(".semantic-item h2")) && elem.parentElement != e.target.closest(".semantic-item h2"))  {
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

	if (window.event.ctrlKey) {
		if (selectedCTRL.getDOM()) {
			selectedCTRL.getDOM().classList.remove('selected-ctrl');
			if (selectedItemsView) {
				document.querySelector("#items-list ." + selectedCTRL._DOMelement).classList.remove('selected-ctrl');
			}
		}
		selectedCTRL.setDOM(elem.id);
		selectedCTRL.getDOM().classList.add('selected-ctrl');
		if (selectedItemsView) {
			document.querySelector("#items-list ." + selectedCTRL._DOMelement).classList.add('selected-ctrl');
		}
		if (selectedCTRL.getDOM().classList.contains("selected-lmb")) {
			selectedLMB.setDOM(null);
			selectedCTRL.getDOM().classList.remove("selected-lmb");
			if (selectedItemsView) {
				document.querySelector("#items-list ." + selectedCTRL._DOMelement).classList.remove('selected-lmb');
			}
		}
	} else {
		if (selectedLMB.getDOM()) {
			selectedLMB.getDOM().classList.remove('selected-lmb');
			if (selectedItemsView) {
				document.querySelector("#items-list ." + selectedLMB._DOMelement).classList.remove('selected-lmb');
			}
		}
		selectedLMB.setDOM(elem.id);
		selectedLMB.getDOM().classList.add('selected-lmb');
		if (selectedItemsView) {
			document.querySelector("#items-list ." + selectedLMB._DOMelement).classList.add('selected-lmb');
		}
		if (selectedLMB.getDOM().classList.contains("selected-ctrl")) {
			selectedCTRL.setDOM(null);
			selectedLMB.getDOM().classList.remove("selected-ctrl");
			if (selectedItemsView) {
				document.querySelector("#items-list ." + selectedLMB._DOMelement).classList.remove('selected-ctrl');
			}
		}
	}

	selectedItem.elem = elem;
	selectedItem.downX = e.pageX;
	selectedItem.downY = e.pageY;
	updateEverything();
}

document.querySelector("#ws").onmousemove = function(e) {		//процесс перетаскивания элементов (перемещение мыши с зажатым ЛКМ)
	if (!selectedItem.elem) {
		return;
	}

	if (!selectedItem.avatar) {
		let moveX = e.pageX - selectedItem.downX;
		let moveY = e.pageY - selectedItem.downY;

		selectedItem.avatar = selectedItem.elem;

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

document.querySelector("#ws").onmouseup = function(e) {		//окончание перетаскивания элементов (отспускание ЛКМ)
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

	updateEverything();
}

deleteButton.addEventListener("click", function() {		//удаление объекта
	deleteSemanticItem(selectedLMB);	
	updateEverything();
});

connectButton.addEventListener("click", function() {	//создание соединения
	makeConnection(connectionsCreateCounter, selectedLMB, selectedCTRL, "test");
	connectionsCreateCounter++;
	updateEverything();
});

createNewButton.addEventListener("click", function () {		//создание нового элемента
	changeIdentificator = "create";
	prepareWindow();
	appearEditWindow();
	//document.querySelector(".item-panel").innerHTML = 
	//appearEditWindow();
	itemsCreateCounter++;
	updateEverything();
});

function appearEditWindow() {		//функция появления окна создания/редактирования элементов
	document.querySelector(".item-panel").style.display = "block";
	document.querySelector(".dark-background").style.display = "block";
	updateEverything();
	setTimeout(function() {
		document.querySelector(".dark-background").style.opacity = "0.5";
		document.querySelector(".item-panel").style.opacity = "1";
		document.querySelector(".item-panel").style.transform = "scale(1, 1)";
	}, 50);
}

function hideEditWindow() {		//функция скрытия окна создания/редактирования элементов
	document.querySelector(".dark-background").style.opacity = "0";
	document.querySelector(".item-panel").style.opacity = "0";
	document.querySelector(".item-panel").style.transform = "scale(0.8, 0.8)";
	setTimeout(function() {
		document.querySelector(".item-panel").style.transform = "";
		document.querySelector(".item-panel").style.display = "";
		document.querySelector(".dark-background").style.display = "";
		document.querySelector(".item-panel").innerHTML = "";
	}, 550);
}

darkBackground.addEventListener("click", function() {		//закрытие окна создания/редактирования при нажатии за его область
	hideEditWindow();
})

function prepareWindow(prepSemanticItem) {		//подготовка окна создания/редактирования 
	switch (changeIdentificator) {
		case "edit":
			for (let key in prepSemanticItem.data) {
				if (key == "header") {
					document.querySelector(".item-panel").innerHTML += '<h2><input class="data-header" type="text" value="' + prepSemanticItem.data[key] + '"></h2><ul class="data-list">';
				} else if (key != "top" && key != "left"){
					document.querySelector(".item-panel ul").innerHTML += '<li><input class="data-index" type="text" value="' + key + '"><input type="text" class="data-value" value="' + prepSemanticItem.data[key] + '"><div  class="button sem-data-delete"><i class="fas fa-minus"></i><span>Удалить свойство</span></div></li>';
				}
			}
			document.querySelector(".item-panel").innerHTML += '</ul><div class="button-place"><div id="new-sem-item-data" class="button"><i class="fas fa-plus"></i><span>Добавить&nbspсвойство</span></div><div id="sem-done" class="button"><i class="fas fa-check"></i><span>Применить</span></div></div>';
			document.querySelector("#new-sem-item-data").addEventListener("click", function() {
				document.querySelectorAll(".data-index").forEach(function(item) {
					item.defaultValue = item.value;
				})
				document.querySelectorAll(".data-value").forEach(function(item) {
					item.defaultValue = item.value;
				})
				document.querySelector(".item-panel ul").innerHTML += '<li><input class="data-index" type="text" value="Index"><input type="text" class="data-value" value="Value"><div  class="button sem-data-delete"><i class="fas fa-minus"></i><span>Удалить свойство</span></div></li>';
				document.querySelectorAll(".sem-data-delete").forEach(function(item) {
				item.children[0].addEventListener("click", function(e) {
					if (e.target.parentElement.localName == "li") {
						e.target.parentElement.remove();
					} else if (e.target.parentElement.parentElement.localName == "li") {
							e.target.parentElement.parentElement.remove();
					}
				})
				item.children[1].addEventListener("click", function(e) {
					if (e.target.parentElement.localName == "li") {
						e.target.parentElement.remove();
					} else if (e.target.parentElement.parentElement.localName == "li") {
							e.target.parentElement.parentElement.remove();
					}
				})
			})
			});
			document.querySelectorAll(".sem-data-delete").forEach(function(item) {
				item.children[0].addEventListener("click", function(e) {
					if (e.target.parentElement.localName == "li") {
						e.target.parentElement.remove();
					} else if (e.target.parentElement.parentElement.localName == "li") {
							e.target.parentElement.parentElement.remove();
					}
				})
				item.children[1].addEventListener("click", function(e) {
					if (e.target.parentElement.localName == "li") {
						e.target.parentElement.remove();
					} else if (e.target.parentElement.parentElement.localName == "li") {
							e.target.parentElement.parentElement.remove();
					}
				})
			})
			document.querySelector("#sem-done").addEventListener("click", function() {
				for (let key in prepSemanticItem.data) {
					if (key != "header" && key != "top" && key != "left"){
						delete prepSemanticItem.data[key];
					}
				}
				prepSemanticItem.setData("header", document.querySelector(".data-header").value);
				let listIndex = [];
				document.querySelectorAll(".data-index").forEach(function(item) {
					listIndex.push(item.value);
				});
				let listValue = [];
				document.querySelectorAll(".data-value").forEach(function(item) {
					listValue.push(item.value);
				});

				for (let i = 0; i < listIndex.length; i++) {
				  prepSemanticItem.setData(listIndex[i] ,listValue[i])
				}
				hideEditWindow();
				updateEverything();
			})
			break;
		case "create":
			document.querySelector(".item-panel").innerHTML += '<h2><input class="data-header" type="text" value="Название"></h2><ul class="data-list">';
			document.querySelector(".item-panel").innerHTML += '</ul><div class="button-place"><div id="new-sem-item-data" class="button"><i class="fas fa-plus"></i><span>Добавить&nbspсвойство</span></div><div id="sem-done" class="button"><i class="fas fa-check"></i><span>Применить</span></div></div>';
			document.querySelector("#new-sem-item-data").addEventListener("click", function() {
				document.querySelectorAll(".data-index").forEach(function(item) {
					item.defaultValue = item.value;
				})
				document.querySelectorAll(".data-value").forEach(function(item) {
					item.defaultValue = item.value;
				})
				document.querySelector(".item-panel ul").innerHTML += '<li><input class="data-index" type="text" value="Index"><input type="text" class="data-value" value="Value"><div  class="button sem-data-delete"><i class="fas fa-minus"></i><span>Удалить свойство</span></div></li>';
				document.querySelectorAll(".sem-data-delete").forEach(function(item) {
				item.children[0].addEventListener("click", function(e) {
					if (e.target.parentElement.localName == "li") {
						e.target.parentElement.remove();
					} else if (e.target.parentElement.parentElement.localName == "li") {
							e.target.parentElement.parentElement.remove();
					}
				})
				item.children[1].addEventListener("click", function(e) {
					if (e.target.parentElement.localName == "li") {
						e.target.parentElement.remove();
					} else if (e.target.parentElement.parentElement.localName == "li") {
							e.target.parentElement.parentElement.remove();
					}
				})
			})
			});
			document.querySelectorAll(".sem-data-delete").forEach(function(item) {
				item.children[0].addEventListener("click", function(e) {
					if (e.target.parentElement.localName == "li") {
						e.target.parentElement.remove();
					} else if (e.target.parentElement.parentElement.localName == "li") {
							e.target.parentElement.parentElement.remove();
					}
				})
				item.children[1].addEventListener("click", function(e) {
					if (e.target.parentElement.localName == "li") {
						e.target.parentElement.remove();
					} else if (e.target.parentElement.parentElement.localName == "li") {
							e.target.parentElement.parentElement.remove();
					}
				})
			})
			document.querySelector("#sem-done").addEventListener("click", function() {
				let list = {};
				let listIndex = [];
				document.querySelectorAll(".data-index").forEach(function(item) {
					listIndex.push(item.value);
				});
				let listValue = [];
				document.querySelectorAll(".data-value").forEach(function(item) {
					listValue.push(item.value);
				});
				list['header'] = document.querySelector(".data-header").value;
				for (let i = 0; i < listIndex.length; i++) {
					list[listIndex[i]] = listValue[i];
				}
				createSemanticItem(itemsCreateCounter, list);
				hideEditWindow();
				updateEverything();
			})
			break;
		case "connect":

			break;
		case "delete":

			break;
		default:
	}
	updateEverything()
}

function findSelected(which) {		//функция поиска выбранного объекта
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

rightItemButton.addEventListener("click", function(e) {		//выбор отображения элементов
	if (!selectedItemsView) {
		selectedItemsView = true;
		document.querySelector("#connections-r").classList.remove("right-selected");
		document.querySelector("#items-r").classList.add("right-selected");
	}
	checkList();
})

rightConnectionsButton.addEventListener("click", function(e) {		//выбор отображения связей
	if (selectedItemsView) {
		selectedItemsView = false;
		document.querySelector("#items-r").classList.remove("right-selected");
		document.querySelector("#connections-r").classList.add("right-selected");
	}
	checkList();
})

editButton.addEventListener("click", function() {		//редактирование объектов
	if (selectedLMB.getDOM()) {
		changeIdentificator = "edit";
		prepareWindow(findSelected("LMB"));
		appearEditWindow();
	} else {
		alert("Не выбран элемент!")
	}
})

function checkList() {		//функция обновления списка объектов
	document.querySelector("#items-list").innerHTML = '';
	if (selectedItemsView) {
		listOfSemanticItems.forEach(function(item) {
			document.querySelector("#items-list").innerHTML += '<li class="item ' + item._DOMelement + '">' + item.data.header + '</li>';
			if (item._DOMelement == selectedLMB._DOMelement) {
				document.querySelector("." + item._DOMelement).classList.add("selected-lmb");
			} else if (item._DOMelement == selectedCTRL._DOMelement) {
				document.querySelector("." + item._DOMelement).classList.add("selected-ctrl");
			}
		})
		document.querySelectorAll(".item").forEach(function(item) {
			item.addEventListener("click", function(e) {
				if (e.which != 1) {
					return;
				}
				if (window.event.ctrlKey) {
					if (selectedCTRL.getDOM()) {
						selectedCTRL.getDOM().classList.remove('selected-ctrl');
						document.querySelector("#items-list ." + selectedCTRL._DOMelement).classList.remove('selected-ctrl');
					}
					selectedCTRL.setDOM(item.classList[1]);
					selectedCTRL.getDOM().classList.add('selected-ctrl');
					document.querySelector("#items-list ." + selectedCTRL._DOMelement).classList.add('selected-ctrl');
					if (selectedCTRL.getDOM().classList.contains("selected-lmb")) {
						selectedLMB.setDOM(null);
						selectedCTRL.getDOM().classList.remove("selected-lmb")
						document.querySelector("#items-list ." + selectedCTRL._DOMelement).classList.remove('selected-lmb');
					}
				} else {
					if (selectedLMB.getDOM()) {
						selectedLMB.getDOM().classList.remove('selected-lmb');
						document.querySelector("#items-list ." + selectedLMB._DOMelement).classList.remove('selected-lmb');
					}
					selectedLMB.setDOM(item.classList[1]);
					selectedLMB.getDOM().classList.add('selected-lmb');
					document.querySelector("#items-list ." + selectedLMB._DOMelement).classList.add('selected-lmb');
					if (selectedLMB.getDOM().classList.contains("selected-ctrl")) {
						selectedCTRL.setDOM(null);
						selectedLMB.getDOM().classList.remove("selected-ctrl")
						document.querySelector("#items-list ." + selectedLMB._DOMelement).classList.remove('selected-ctrl');
					}
				}
			})
		})
	} else {
		listOfSemanticConnections.forEach(function(item, index) {
			document.querySelector("#items-list").innerHTML += '<li class="item c' + index + '">' + item.idA + ' <i class="fas fa-long-arrow-alt-right"></i> ' + item.typeOfConnection + ' <i class="fas fa-long-arrow-alt-right"></i> ' + item.idB + '</li>';
		})
	}
}