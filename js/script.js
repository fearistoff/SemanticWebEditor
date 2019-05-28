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

let openButton = document.getElementById("open-sem-item");				//кнопка открытия XML файла
let saveButton = document.getElementById("save-sem-item");
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
let selectedItem = {};																									//выбранный элемент при перемещении
let blackTheme = true;																									//выбранная тема оформления интерфейса
let selectedItemsView = true;																						//выбранный тип, отображаемый в списке объектов
let selectedLMB = new SemanticItem(null);																//первый выбранный элемент/связь
let selectedCTRL = new SemanticItem(null);															//второй выбранный элемент 
let listOfSemanticConnections = [];																			//список связей
let listOfSemanticItems = [];																						//список элементов
let OWLtoJSONfile;														//открытый файл переведённый в формат объекта

function upadteLength(array) {		//Пересчёт и группировка массива. Необходим при удалении элементов
	array.sort();
	let i = 0;
	array.forEach(function() {
		i++;
	});
	array.length = i;
}

function makeConnection(itemA, itemB, type) {		//функция создания связи
	const newSemCon = new SemanticConnection(itemA, itemB, type);
	listOfSemanticConnections.push(newSemCon);
}

function createSemanticItem(data) {		//функция создания элемента
	let nemItem;
	workspace.innerHTML += `<div id="s${itemsCreateCounter}" class="semantic-item"></div>`;
	nemItem = document.querySelector("#s" + itemsCreateCounter);
	nemItem.innerHTML += `<div class="identifier">s${itemsCreateCounter}</div>`;
	const newSemIte =  new SemanticItem(nemItem.id);
	listOfSemanticItems.push(newSemIte);
	nemItem.style.top = (itemsCreateCounter+1)*10 + "px";
	listOfSemanticItems[itemsCreateCounter].setData("top" , (itemsCreateCounter+1)*10);
	nemItem.style.left = (itemsCreateCounter+1)*10 + "px";
	listOfSemanticItems[itemsCreateCounter].setData("left" , (itemsCreateCounter+1)*10);
	nemItem.innerHTML += `<h2>${data["header"]}</h2>`;
	nemItem.innerHTML += `<ul></ul>`;
	for (let key in data) {
	  listOfSemanticItems[itemsCreateCounter].setData(key, data[key]);
	  if (key != "header") {
	  	document.querySelector("#s" + itemsCreateCounter + " ul").innerHTML += `<li>${key} : ${data[key]}</li>`;
	  }
	}
	listOfSemanticItems[itemsCreateCounter].setData("header" , data["header"]);
	itemsCreateCounter++;
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
	if (semanticItemToDelete instanceof SemanticItem) {
		listOfSemanticItems.forEach(function(item, index) {
			if (semanticItemToDelete._DOMelement == item._DOMelement) {
				document.getElementById(item._DOMelement).remove()
				if (listOfSemanticConnections.length) {
					listOfSemanticConnections.forEach(function(item2, index2) {
						if (item2.getIds().includes(semanticItemToDelete._DOMelement)) {
							delete listOfSemanticConnections[index2];
						}
					});
				}
				listOfSemanticItems.splice(index, 1);
				return;
			}
		});
	} else {
		listOfSemanticConnections.forEach(function(item, index) {
			if (semanticItemToDelete.idA == item.idA && semanticItemToDelete.idB == item.idB) {
				listOfSemanticConnections.splice(index, 1);
				return;
			}
		});
	}
	updateEverything();
}

function adaptivePanel() {		//функция обновления позиционирования окна создания/редактирования
	document.querySelector("#main-container").style.height = (parseInt(window.innerHeight) - 85) + "px";
	let itemPanel = document.querySelector(".item-panel");
	let height = document.querySelector(".item-panel").offsetHeight;
	let width = document.querySelector(".item-panel").offsetWidth;
	document.querySelector(".item-panel").style.top = (window.innerHeight/2 - height/2) + "px";
	document.querySelector(".item-panel").style.left = 115 + "px";
	document.querySelector("#items-list").style.height = (document.querySelector("#items").offsetHeight - 55) + "px";
	height = document.querySelector(".notification-connection-window").offsetHeight;
	width = document.querySelector(".notification-connection-window").offsetWidth;
	document.querySelector(".notification-connection-window").style.top = (window.innerHeight/2 - height/2) + "px";
	document.querySelector(".notification-connection-window").style.left = (window.innerWidth/2 - width/2) + "px";
}

function refreshItemInfo() {		//функция обновления подиспей заголовков и свойств элементов
	listOfSemanticItems.forEach(function(item) {
		document.querySelector("#" + item._DOMelement + " h2").innerHTML = item.data["header"];
		document.querySelector("#" + item._DOMelement + " ul").innerHTML = "";
		for (let key in item.data) {
			if (key != "top" && key != "left" && key != "header") {
				document.querySelector("#" + item._DOMelement + " ul").innerHTML += `<li>${key}:${item.data[key]}</li>`;
			}
		}
	});
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
});

document.onkeyup = function(e) {		//обработка нажатия клавиш
	if (e.keyCode == 46) {
		deleteItem();
	}
	if (e.keyCode == 13 && document.querySelector(".item-panel").style.display == "block") {
		document.querySelector("#sem-done").click();
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
				selectedConnection = null;
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

function deleteItem() {
	if (selectedLMB.getDOM()) {
		deleteSemanticItem(selectedLMB);
	} else if (selectedConnection) {
		deleteSemanticItem(selectedConnection);
	}	else {
		alert("Ничего не выделено!");
	}
}

deleteButton.addEventListener("click", function() {		//удаление объекта	
	deleteItem();
	updateEverything();
});

connectButton.addEventListener("click", function() {	//создание соединения
	if (selectedLMB.getDOM() && selectedCTRL.getDOM()) {
		prepareWindow("connect");
		appearEditWindow();
		updateEverything();
	} else {
		alert("Не выделены объекты!");
	}
	
});

createNewButton.addEventListener("click", function () {		//создание нового элемента
	prepareWindow("create");
	appearEditWindow();
	//document.querySelector(".item-panel").innerHTML = 
	//appearEditWindow();
	updateEverything();
});

function appearEditWindow() {		//функция появления окна создания/редактирования элементов
	document.querySelector(".item-panel").style.display = "block";
	document.querySelector(".dark-background").style.display = "block";
	updateEverything();
	setTimeout(function() {
		document.querySelector(".dark-background").style.opacity = "0.5";
		document.querySelector(".item-panel").style.opacity = "1";
		document.querySelector(".item-panel").style.transform = "scale(1)";
	}, 50);
}

function hideEditWindow() {		//функция скрытия окна создания/редактирования элементов
	document.querySelector(".dark-background").style.opacity = "";
	document.querySelector(".item-panel").style.opacity = "";
	document.querySelector(".item-panel").style.transform = "";
	setTimeout(function() {
		document.querySelector(".item-panel").style.transform = "";
		document.querySelector(".item-panel").style.display = "";
		document.querySelector(".dark-background").style.display = "";
		document.querySelector(".item-panel").innerHTML = "";
	}, 550);
}

darkBackground.addEventListener("click", function() {		//закрытие окна создания/редактирования при нажатии за его область
	hideEditWindow();
});

function prepareWindow(changeIdentificator, prepSemanticItem) {		//функция подготовки окна создания/редактирования 
	switch (changeIdentificator) {
		case "edit":
			for (let key in prepSemanticItem.data) {
				if (key == "header") {
					document.querySelector(".item-panel").innerHTML += `<h4><i class="fas fa-pen"></i> Редактирование элемента</h4><h3><input class="data-header" type="text" placeholder="Название" value="${prepSemanticItem.data[key]}" autofocus></h3><ul class="data-list">`;
				} else if (key != "top" && key != "left"){
					document.querySelector(".item-panel ul").innerHTML += `<li><input class="data-index" type="text" value="${key}"><input type="text" class="data-value" value="${prepSemanticItem.data[key]}"><div  class="button sem-data-delete"><i class="fas fa-minus"></i><span>Удалить свойство</span></div></li>`;
				}
			}
			document.querySelector(".item-panel").innerHTML += `</ul><div class="button-place"><div id="new-sem-item-data" class="button"><i class="fas fa-plus"></i><span>Добавить&nbspсвойство</span></div><div id="sem-done" class="button"><i class="fas fa-check"></i><span>Применить</span></div></div>`;
			document.querySelector("#new-sem-item-data").addEventListener("click", function() {
				document.querySelectorAll(".data-index").forEach(function(item) {
					item.defaultValue = item.value;
				});
				document.querySelectorAll(".data-value").forEach(function(item) {
					item.defaultValue = item.value;
				});
				document.querySelector(".item-panel ul").innerHTML += `<li><input class="data-index" type="text" value="Index"><input type="text" class="data-value" value="Value"><div  class="button sem-data-delete"><i class="fas fa-minus"></i><span>Удалить свойство</span></div></li>`;
				document.querySelectorAll(".sem-data-delete").forEach(function(item) {
				item.children[0].addEventListener("click", function(e) {
					if (e.target.parentElement.localName == "li") {
						e.target.parentElement.remove();
					} else if (e.target.parentElement.parentElement.localName == "li") {
							e.target.parentElement.parentElement.remove();
					}
				});
				item.children[1].addEventListener("click", function(e) {
					if (e.target.parentElement.localName == "li") {
						e.target.parentElement.remove();
					} else if (e.target.parentElement.parentElement.localName == "li") {
							e.target.parentElement.parentElement.remove();
					}
				});
			});
			});
			document.querySelectorAll(".sem-data-delete").forEach(function(item) {
				item.children[0].addEventListener("click", function(e) {
					if (e.target.parentElement.localName == "li") {
						e.target.parentElement.remove();
					} else if (e.target.parentElement.parentElement.localName == "li") {
							e.target.parentElement.parentElement.remove();
					}
				});
				item.children[1].addEventListener("click", function(e) {
					if (e.target.parentElement.localName == "li") {
						e.target.parentElement.remove();
					} else if (e.target.parentElement.parentElement.localName == "li") {
							e.target.parentElement.parentElement.remove();
					}
				});
			});
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
			});
			break;
		case "create":
			document.querySelector(".item-panel").innerHTML += `<h4><i class="fas fa-plus"></i> Создание элемента</h4><h3><input class="data-header" type="text" value="" placeholder="Название" autofocus></h3><ul class="data-list">`;
			document.querySelector(".item-panel").innerHTML += `</ul><div class="button-place"><div id="new-sem-item-data" class="button"><i class="fas fa-plus"></i><span>Добавить&nbspсвойство</span></div><div id="sem-done" class="button"><i class="fas fa-check"></i><span>Применить</span></div></div>`;
			document.querySelector("#new-sem-item-data").addEventListener("click", function() {
				document.querySelectorAll(".data-index").forEach(function(item) {
					item.defaultValue = item.value;
				});
				document.querySelectorAll(".data-value").forEach(function(item) {
					item.defaultValue = item.value;
				});
				document.querySelector(".item-panel ul").innerHTML += `<li><input class="data-index" type="text" value="Index"><input type="text" class="data-value" value="Value"><div  class="button sem-data-delete"><i class="fas fa-minus"></i><span>Удалить свойство</span></div></li>`;
				document.querySelectorAll(".sem-data-delete").forEach(function(item) {
				item.children[0].addEventListener("click", function(e) {
					if (e.target.parentElement.localName == "li") {
						e.target.parentElement.remove();
					} else if (e.target.parentElement.parentElement.localName == "li") {
							e.target.parentElement.parentElement.remove();
					}
				});
				item.children[1].addEventListener("click", function(e) {
					if (e.target.parentElement.localName == "li") {
						e.target.parentElement.remove();
					} else if (e.target.parentElement.parentElement.localName == "li") {
							e.target.parentElement.parentElement.remove();
					}
				});
			});
			});
			document.querySelectorAll(".sem-data-delete").forEach(function(item) {
				item.children[0].addEventListener("click", function(e) {
					if (e.target.parentElement.localName == "li") {
						e.target.parentElement.remove();
					} else if (e.target.parentElement.parentElement.localName == "li") {
							e.target.parentElement.parentElement.remove();
					}
				});
				item.children[1].addEventListener("click", function(e) {
					if (e.target.parentElement.localName == "li") {
						e.target.parentElement.remove();
					} else if (e.target.parentElement.parentElement.localName == "li") {
							e.target.parentElement.parentElement.remove();
					}
				});
			});
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
				createSemanticItem(list);
				hideEditWindow();
				updateEverything();
			});
			break;
		case "connect":
			document.querySelector(".item-panel").innerHTML += `<h4><i class="fas fa-plus"></i> Создание связи ${selectedLMB._DOMelement} <i class="fas fa-long-arrow-alt-right"></i> ${selectedCTRL._DOMelement}</h4>
																<h3><input class="data-header" type="text" value="" placeholder="Название" autofocus></h3>
																<div class="button-place"><div></div><div id="sem-done" class="button"><i class="fas fa-check"></i><span>Применить</span></div></div>`;
			document.getElementById("sem-done").addEventListener("click", () => {
				makeConnection(selectedLMB, selectedCTRL, document.querySelector(".data-header").value);
				hideEditWindow();
				updateEverything();
			});
			break;
		case "connect-edit":
			document.querySelector(".item-panel").innerHTML += `<h4><i class="fas fa-plus"></i> Редактирование связи ${prepSemanticItem.idA} <i class="fas fa-long-arrow-alt-right"></i> ${prepSemanticItem.idB}</h4>
																<h3><input class="data-header" type="text" value="${prepSemanticItem.typeOfConnection}" placeholder="Название" autofocus></h3>
																<div class="button-place"><div></div><div id="sem-done" class="button"><i class="fas fa-check"></i><span>Применить</span></div></div>`;
			document.getElementById("sem-done").addEventListener("click", () => {
				prepSemanticItem["typeOfConnection"] = document.querySelector(".data-header").value;
				hideEditWindow();
				updateEverything();
			});
			break;
		default:
	}
	updateEverything();
}

function findSemanticItem(id) {
	let result;
	listOfSemanticItems.forEach(item => {
		if (item._DOMelement == id) {
			result = item;
		}
	});
	return result;
}

function findSelectedItem(which) {		//функция поиска выбранного элемента
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
		selectedLMB.setDOM(null);
		selectedCTRL.setDOM(null);
		selectedItemsView = true;
		if (document.querySelector(".selected-lmb")) {
			document.querySelector(".selected-lmb").classList.remove("selected-lmb");
		}
		if (document.querySelector(".selected-ctrl")) {
			document.querySelector(".selected-ctrl").classList.remove("selected-ctrl");
		}
		document.querySelector("#connections-r").classList.remove("right-selected");
		document.querySelector("#items-r").classList.add("right-selected");
	}
	checkList();
});

rightConnectionsButton.addEventListener("click", function(e) {		//выбор отображения связей
	if (selectedItemsView) {
		selectedLMB.setDOM(null);
		selectedCTRL.setDOM(null);
		selectedItemsView = false;
		if (document.querySelector(".selected-lmb")) {
			document.querySelector(".selected-lmb").classList.remove("selected-lmb");
		}
		if (document.querySelector(".selected-ctrl")) {
			document.querySelector(".selected-ctrl").classList.remove("selected-ctrl");
		}
		document.querySelector("#items-r").classList.remove("right-selected");
		document.querySelector("#connections-r").classList.add("right-selected");
	}
	checkList();
});

editButton.addEventListener("click", function() {		//редактирование объектов
	if (selectedLMB.getDOM()) {
		prepareWindow("edit", findSelectedItem("LMB"));
		appearEditWindow();
	} else if (selectedConnection) {
		prepareWindow("connect-edit", selectedConnection);
		appearEditWindow();
	} else {
		alert("Не выбран элемент!")
	}
});

function checkList() {		//функция обновления списка объектов
	document.querySelector("#items-list").innerHTML = '';
	if (selectedItemsView) {
		listOfSemanticItems.forEach(function(item) {
			document.querySelector("#items-list").innerHTML += `<li class="item ${item._DOMelement}"><div class="identifier">${item._DOMelement}</div>${item.data.header}</li>`;
			if (item._DOMelement == selectedLMB._DOMelement) {
				document.querySelector("." + item._DOMelement).classList.add("selected-lmb");
			} else if (item._DOMelement == selectedCTRL._DOMelement) {
				document.querySelector("." + item._DOMelement).classList.add("selected-ctrl");
			}
		});
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
			});
		});
	} else {
		listOfSemanticConnections.forEach(function(item, index) {
			document.querySelector("#items-list").innerHTML += `<li class="item c${index}">${item.idA} <i class="fas fa-long-arrow-alt-right"></i> ${item.typeOfConnection} <i class="fas fa-long-arrow-alt-right"></i> ${item.idB}</li>`;
		});
		document.querySelectorAll("#items-list li").forEach(function(item, index) {
			item.addEventListener("click", function() {
				if (document.querySelector(".selected-lmb")) {
					document.querySelector(".selected-lmb").classList.remove("selected-lmb");
				}
				this.classList.add("selected-lmb");
				selectedConnection = listOfSemanticConnections[index];
			});
		});
	}
}
openButton.addEventListener("change", function(e) {
	var files = e.target.files;
    var file = files[0];           
    var reader = new FileReader();
    for(let i = listOfSemanticItems.length - 1; i >= 0; i--) {
    	deleteSemanticItem(listOfSemanticItems[i]);
    }
    listOfSemanticConnections.forEach(function(item) {
    	deleteSemanticItem(item);
    });
    updateEverything();
    reader.onload = function(event) {
    	OWLtoJSONfile = loadXMLtoJSON(event.target.result);
    	if (OWLtoJSONfile) {
	        OWLtoJSONfile = JSON.parse(OWLtoJSONfile);
	        readOWLFile(OWLtoJSONfile);
	        updateEverything();
    	}
    }
    reader.readAsText(file)
});

function readOWLFile(JSONobject) {
	//избавиться от кириллицы в коде
	let valueID;
	let quequedConnections;
	console.log(JSONobject);
	for (let key in OWLtoJSONfile.Declaration[0].Class[0]) { 
		valueID = key;
	}
	JSONobject.Declaration.forEach(function(item) {
		if (item.hasOwnProperty("Class")) {
			createSemanticItem({"header": deleteSharp(item.Class[0][valueID]), "Тип": "Класс"});
		} else if (item.hasOwnProperty("ObjectPropertyAssertion")) {
			//что там?...
		}
	});

	JSONobject.ClassAssertion.forEach(function(item) {
		quequedConnections = {};
		createSemanticItem({"header": deleteSharp(item.NamedIndividual[0][valueID]), "Тип": "Объект класса"});
		listOfSemanticItems.forEach(function(semitem) {
			if (semitem.data.header == deleteSharp(item.NamedIndividual[0][valueID])) {
				quequedConnections["itemA"] = semitem;
			}
			if (semitem.data.header == deleteSharp(item.Class[0][valueID])) {
				quequedConnections["itemB"] = semitem;
			}
		});
		quequedConnections["type"] = "Является объектом класса";
		makeConnection(quequedConnections.itemA, quequedConnections.itemB, quequedConnections.type);
	});
	//Проблема со строками (в некоторых случаях нет списка и не получается получить доступ)
	JSONobject.DataPropertyAssertion.forEach(function(item) {
		listOfSemanticItems.forEach(function(semitem) {
			if(deleteSharp(item.NamedIndividual[0][valueID]) == semitem.data.header) {
				if (item.Literal.__text) {
					semitem.data[deleteSharp(item.DataProperty[0][valueID])] = item.Literal.__text;
				} else {
					if(item.DataProperty[valueID]) {
						semitem.data[deleteSharp(item.DataProperty[valueID])] = item.Literal;
					} else {
						semitem.data[deleteSharp(item.DataProperty[0][valueID])] = item.Literal;
					}
				}
			}
		});
	});

	JSONobject.ObjectPropertyAssertion.forEach(function(item, index) {
		quequedConnections = {};
		listOfSemanticItems.forEach(function(semitem) {
			if (semitem.data.header == deleteSharp(item.NamedIndividual[0][valueID])) {
				quequedConnections["itemA"] = semitem;
			}
			if (semitem.data.header == deleteSharp(item.NamedIndividual[1][valueID])) {
				quequedConnections["itemB"] = semitem;
			}
		});
		quequedConnections["type"] = deleteSharp(item.ObjectProperty[valueID]);
		makeConnection(quequedConnections.itemA, quequedConnections.itemB, quequedConnections.type);
	});

	JSONobject.SubClassOf.forEach(function(item) {
		listOfSemanticItems.forEach(function(firsrItem) {
			if (deleteSharp(item.Class[0][valueID]) == firsrItem.data.header) {
				listOfSemanticItems.forEach(function(secondItem) {
					if (deleteSharp(item.Class[1][valueID]) == secondItem.data.header) {
						makeConnection(firsrItem, secondItem, "Является подклассом");
					}
				});
			}
		});
	});
}

function deleteSharp(stringSh) {
	return stringSh.replace('#','');
}

function addSharp(stringSh) {
	return '#' + stringSh;
}

function wriTeOWLFile() {
	let JSONobject = {
		"_xmlns" : `http://www.w3.org/2002/07/owl#`,
		"_xmlns:rdf" : `http://www.w3.org/1999/02/22-rdf-syntax-ns#`,
		"_xmlns:rdfs" : `http://www.w3.org/2000/01/rdf-schema#`,
		"_xmlns:xsd" : `http://www.w3.org/2001/XMLSchema#`,
		"Prefix" : [{
			"_IRI": `http://www.w3.org/2002/07/owl#`,
			"_name": `owl`
		},{
			"_IRI": `http://www.w3.org/1999/02/22-rdf-syntax-ns#`,
			"_name": `rdf`
		},{
			"_IRI": `http://www.w3.org/XML/1998/namespace`,
			"_name": `xml`
		},{
			"_IRI": `http://www.w3.org/2001/XMLSchema#`,
			"_name": `xsd`
		},{
			"_IRI": `http://www.w3.org/2000/01/rdf-schema#`,
			"_name": `rdfs`
		}]
	};
	let listOfPropsNames = [];



	// DataPropertyDomain: (4) [{…}, {…}, {…}, {…}]  !!!!!!!!!!!!!!!!!!!!!!!
	// ObjectPropertyDomain: (2) [{…}, {…}]		//то, чем занимаются объекты класса
	// ObjectPropertyRange: (2) [{…}, {…}]		//те объекты, которые являются только конечными элементами и сами ничего не делают 
	// SubDataPropertyOf: {DataProperty: Array(2)}	!!!!!!!!!!!!!!!!!!!!!!!!

	//вставить все области внутрь первого объявления JSONobject

	listOfSemanticItems.forEach((item, index) => {
		if (item.data["Тип"] == "Класс") {
			if (!JSONobject.hasOwnProperty("Declaration")) {
				JSONobject["Declaration"] = [];
			}
			JSONobject["Declaration"].push({"Class": [{"_IRI" : addSharp(item.data.header)}]});
		}
		if (item.data["Тип"] == "Объект класса") {
			if (!JSONobject.hasOwnProperty("DataPropertyAssertion")) {
				JSONobject["DataPropertyAssertion"] = [];
			}
			
			for (let key in item.data) {
				if (key != "header" && key != "Тип" && key != "top" && key != "left") {
					if (listOfPropsNames.indexOf(key) == -1) {
						listOfPropsNames.push(key);
					}
					JSONobject["DataPropertyAssertion"].push({
						"DataProperty": [{"_IRI" : addSharp(key)}],
						"NamedIndividual": [{"_IRI" : addSharp(item.data.header)}],
						"Literal" : item.data[key]
					});
				}
			}
			JSONobject["Declaration"].push({
				"NamedIndividual" : [{"_IRI" : addSharp(item.data.header)}]
			})
		}
	});
	listOfPropsNames.forEach(itemName => {
		if (!JSONobject.hasOwnProperty("DataPropertyRange")) {
			JSONobject["DataPropertyRange"] = [];
		}
		JSONobject["DataPropertyRange"].push({
			"DataProperty" : [{"_IRI" : addSharp(itemName)}],
			"Datatype" : { "_abbreviatedIRI" : "xsd:string" }
		})
		JSONobject["Declaration"].push({
			"DataProperty" : [{"_IRI" : addSharp(itemName)}]
		});
	});
	listOfPropsNames = [];
	listOfSemanticConnections.forEach(item => {
		if (item.typeOfConnection != "Является объектом класса" && item.typeOfConnection != "Является подклассом") {
			if (listOfPropsNames.indexOf(item.typeOfConnection) == -1) {
				listOfPropsNames.push(item.typeOfConnection);
			}
			if (!JSONobject.hasOwnProperty("ObjectPropertyAssertion")) {
				JSONobject["ObjectPropertyAssertion"] = [];
			}
			JSONobject.ObjectPropertyAssertion.push({
				"NamedIndividual" : [{"_IRI" : addSharp(findSemanticItem(item.idA).data.header)},{"_IRI":addSharp(findSemanticItem(item.idB).data.header)}],
				"ObjectProperty" : {"_IRI":addSharp(item.typeOfConnection)}
			});
		}
		if (item.typeOfConnection == "Является подклассом") {
			if (!JSONobject.hasOwnProperty("DisjointClasses")) {
				JSONobject["DisjointClasses"] = {};
				JSONobject.DisjointClasses["Class"] = [];
			}
			if (!JSONobject.hasOwnProperty("SubClassOf")) {
				JSONobject["SubClassOf"] = [];
			}
			JSONobject.SubClassOf.push({"Class" : [{"_IRI": addSharp(findSemanticItem(item.idA).data.header)},{"_IRI":addSharp(findSemanticItem(item.idB).data.header)}]});
		}
		if (item.typeOfConnection == "Является объектом класса") {
			if (!JSONobject.hasOwnProperty("ClassAssertion")) {
				JSONobject["ClassAssertion"] = [];
			}
			JSONobject.ClassAssertion.push({
				"Class" : [{"_IRI" : addSharp(findSemanticItem(item.idB).data.header)}],
				"NamedIndividual" : [{"_IRI" : addSharp(findSemanticItem(item.idA).data.header)}]
			});
		}
	});
	listOfPropsNames.forEach(itemName => {
		JSONobject["Declaration"].push({
			"ObjectProperty" : {"_IRI" : addSharp(itemName)}
		});
	});

	console.log(JSONobject);
	return JSONobject;
}

saveButton.addEventListener("click", () => {
	const res = saveJSONtoXML(JSON.stringify(wriTeOWLFile()));
	const file = new Blob([res], {type: "owl"});
    const a = document.createElement("a");
    const url = URL.createObjectURL(file);
	a.href = url;
	a.download = "owl_ontology.owl";
	document.body.appendChild(a);
	a.click();
	setTimeout(function() {
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);  
	}, 0);
});