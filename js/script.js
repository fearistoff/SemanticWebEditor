"use strict";

const openButton = document.getElementById("open-sem-item");				//кнопка открытия XML файла
const saveButton = document.getElementById("save-sem-item");
const createNewButton = document.querySelector("#new-sem-item");					//кнопка создания нового семантического элемента
const deleteButton = document.querySelector("#delete-sem-item");					//кнопка удаления семантического объекта
const connectButton = document.querySelector("#connect-sem-item");				//кнопка создания семантической связи
const editButton = document.querySelector("#edit-sem-item");							//кнопка редактирования семантического объекта
const workspace = document.querySelector("#workspace");										//рабочее поле
const bnwButton = document.querySelector("#bnw");													//кнопка смены оформления интерфейса
const darkBackground = document.querySelector(".dark-background");				//область затемнения фона при уведомлениях/окнах редактирования/создания объектов
const rightItemButton = document.querySelector("#items-r");								//кнопка отображения списка элементов
const rightConnectionsButton = document.querySelector("#connections-r");	//кнопка отображения списка связей
const canvas = document.querySelector("canvas");													//поле отрисовки линий и печати семантики связей
const context = canvas.getContext("2d");																	//двумерный контекст поля отрисовки
const notificationWindow = document.getElementById("notification-window"); 
const itemsList = document.getElementById("items-list");
const itemPanel = document.querySelector(".item-panel");
const toggleScale = document.getElementById("toggle-scale");
let working = true;
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
let multiplier = 1;

function makeConnection(itemA, itemB, type) {		//функция создания связи
	const newSemCon = new SemanticConnection(itemA, itemB, type);
	listOfSemanticConnections.push(newSemCon);
}

function createSemanticItem(data) {		//функция создания элемента
	const workspaceWidth = workspace.clientWidth;
	let nemItem = document.createElement("div");
	nemItem.id = `s${itemsCreateCounter}`;
	nemItem.classList.add("semantic-item");
	nemItem.innerHTML += `<div class="identifier">s${itemsCreateCounter}</div>`;
	
	let tempTop;
	let tempLeft;
	if (itemsCreateCounter) {
		if (parseInt(listOfSemanticItems[itemsCreateCounter-1].data.left) + 308 < workspaceWidth) {
			tempLeft = (parseInt(listOfSemanticItems[itemsCreateCounter-1].data.left) + 154) + "px";
			tempTop = parseInt(listOfSemanticItems[itemsCreateCounter-1].data.top) + "px";
		} else {
			tempLeft = "5px";
			tempTop = (parseInt(listOfSemanticItems[itemsCreateCounter-1].data.top) + 80) + "px";
		}
	} else {
		tempTop = "5px";
		tempLeft = "5px";
	}
	nemItem.style.top = tempTop;
	nemItem.style.left = tempLeft;
	const newSemIte =  new SemanticItem(nemItem.id);
	listOfSemanticItems.push(newSemIte);
	listOfSemanticItems[itemsCreateCounter].setData("top" , tempTop);
	listOfSemanticItems[itemsCreateCounter].setData("left" , tempLeft);
	nemItem.innerHTML += `<h2>${data["header"]}</h2>
							<ul></ul>
							<div class="toggle-list-view">
								<i class="fas fa-angle-up"></i>
								<i class="fas fa-angle-down"></i>
							</div>`;
	nemItem.querySelector(".toggle-list-view").addEventListener("click", ev => {
		let place = ev.target;
		if (place.tagName === 'I') {
			place = place.parentElement;
		}
		if (place.parentElement.classList.contains("hidden")) {
			place.parentElement.classList.remove("hidden");
		} else {
			place.parentElement.classList.add("hidden");
		}
	});
	for (let key in data) {
	  listOfSemanticItems[itemsCreateCounter].setData(key, data[key]);
	  if (key != "header") {
	  	nemItem.querySelector("ul").innerHTML += `<li>${key} : ${data[key]}</li>`;
	  }
	}
	listOfSemanticItems[itemsCreateCounter].setData("header" , data["header"]);
	workspace.appendChild(nemItem);
	workspace.lastChild.addEventListener("dblclick", () => {
		prepareWindow("edit", findSelectedItem("LMB"));
		appearEditWindow();
		updateEverything();
	});
	itemsCreateCounter++;
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
	context.font = `${multiplier < 1? "bold 10":"12"}px Consolas`;
	context.textAlign = "left";
	context.textBaseline = "hanging";
	if (blackTheme) {
		context.strokeStyle = "#e1e1e1";
			context.fillStyle = "#e1e1e1";
	} else {
		context.strokeStyle = "#191919";
			context.fillStyle = "#191919";
	}
	context.clearRect(0, 0, canvas.width, canvas.height);
	listOfSemanticConnections.forEach(function(item) {
		context.beginPath();
		context.moveTo(parseInt(item.leftA) + 15*multiplier, parseInt(item.topA) + (15 - 3.66)*multiplier);	//top
		context.lineTo(parseInt(item.leftB) + 15*multiplier, parseInt(item.topB) + 15*multiplier);	//target
		context.lineTo(parseInt(item.leftA) + (15 - 5)*multiplier, parseInt(item.topA) + (15 + 5)*multiplier);	//left
		context.closePath();
		context.fill();
		context.beginPath();
		context.moveTo(parseInt(item.leftA) + 15*multiplier, parseInt(item.topA) + (15 - 3.66)*multiplier);	//top
		context.lineTo(parseInt(item.leftB) + 15*multiplier, parseInt(item.topB) + 15*multiplier);	//target
		context.lineTo(parseInt(item.leftA) + (15 + 5)*multiplier, parseInt(item.topA) + (15 + 5)*multiplier);	//right
		context.closePath();
		context.fill();
		
	});
	listOfSemanticConnections.forEach(function(item) {
		context.fillRect((parseInt(item.leftA) + parseInt(item.leftB))/2 + 14, (parseInt(item.topA) + parseInt(item.topB))/2 + 15, item.typeOfConnection.length*6.6*(multiplier < 1?10/12:1) + 2, 14*multiplier);
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
				itemsCreateCounter -= 1;
				updateEverything();
				return;
			}
		});
	} else {
		listOfSemanticConnections.forEach(function(item, index) {
			if (semanticItemToDelete.idA == item.idA && semanticItemToDelete.idB == item.idB) {
				listOfSemanticConnections.splice(index, 1);
				updateEverything();
				return;
			}
		});
	}
}

darkBackground.onmouseover = () => {
	itemPanel.classList.add("fading");
};
darkBackground.onmouseout = () => {

	itemPanel.classList.remove("fading");
};

function adaptivePanel() {		//функция обновления позиционирования окна создания/редактирования
	const label = document.querySelector(".close-label");
	document.querySelector("#main-container").style.height = (parseInt(window.innerHeight) - 85) + "px";
	let height = itemPanel.offsetHeight;
	let width = itemPanel.offsetWidth;
	itemPanel.style.top = (window.innerHeight/2 - height/2) + "px";
	itemPanel.style.left = (window.innerWidth/2 - width/2) + "px";
	label.style.top = ((window.innerHeight/2 - height/2) - label.offsetHeight) + "px";
	label.style.left = ((window.innerWidth/2 - width/2) + itemPanel.offsetWidth/2 - (label.offsetWidth/2)) + "px";
	itemsList.style.height = (document.querySelector("#items").offsetHeight - 55) + "px";
	height = notificationWindow.offsetHeight;
	width = notificationWindow.offsetWidth;
	notificationWindow.style.top = (window.innerHeight/3 - height/2) + "px";
	notificationWindow.style.left = (window.innerWidth/2 - width/2) + "px";
}

function refreshItemInfo() {		//функция обновления подиспей заголовков и свойств элементов
	listOfSemanticItems.forEach(function(item) {
		document.querySelector("#" + item._DOMelement + " h2").innerText = item.data["header"];
		document.querySelector("#" + item._DOMelement + " ul").innerText = "";
		for (let key in item.data) {
			if (key != "top" && key != "left" && key != "header") {
				document.querySelector(`#${item._DOMelement} ul`).innerHTML += `<li></li>`;
				document.querySelector(`#${item._DOMelement} ul`).lastChild.innerText = `${key}:${item.data[key]}`;
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
		updateEverything();
	}
	if (e.keyCode == 13) {
		if (itemPanel.style.display == "block") {
			document.querySelector("#sem-done").click();
			updateEverything();
		}
		if (notificationWindow.style.display == "block") {
			document.querySelector("#true").click();
		}
	}
	if (e.keyCode == 27) {
		if (itemPanel.style.display == "block") {
			hideEditWindow();
		}
		if (notificationWindow.style.display == "block") {
			document.querySelector("#false").click();
		}
	}
}

workspace.onmousedown = function(e) {		//начало перетаскивания элементов (нажатие ЛКМ)
	if (e.which != 1) {
		return;
	}
	let elem = e.target;
	if ((elem == workspace || elem != e.target.closest(".semantic-item h2")) && elem.parentElement != e.target.closest(".semantic-item h2"))  {
		if (elem == workspace) {
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
			if (selectedItemsView) {
				itemsList.querySelector(`.${selectedCTRL._DOMelement}`).classList.remove('selected-ctrl');
			}
		}
		selectedCTRL.setDOM(elem.id);
		selectedCTRL.getDOM().classList.add('selected-ctrl');
		if (selectedItemsView) {
			itemsList.querySelector(`.${selectedCTRL._DOMelement}`).classList.add('selected-ctrl');
		}
		if (selectedCTRL.getDOM().classList.contains("selected-lmb")) {
			selectedLMB.setDOM(null);
			selectedCTRL.getDOM().classList.remove("selected-lmb");
			if (selectedItemsView) {
				itemsList.querySelector(`.${selectedCTRL._DOMelement}`).classList.remove('selected-lmb');
			}
		}
	} else {
		if (selectedLMB.getDOM()) {
			selectedLMB.getDOM().classList.remove('selected-lmb');
			if (selectedItemsView) {
				itemsList.querySelector(`.${selectedLMB._DOMelement}`).classList.remove('selected-lmb');
			}
		}
		selectedLMB.setDOM(elem.id);
		selectedLMB.getDOM().classList.add('selected-lmb');
		if (selectedItemsView) {
			itemsList.querySelector(`.${selectedLMB._DOMelement}`).classList.add('selected-lmb');
		}
		if (selectedLMB.getDOM().classList.contains("selected-ctrl")) {
			selectedCTRL.setDOM(null);
			selectedLMB.getDOM().classList.remove("selected-ctrl");
			if (selectedItemsView) {
				itemsList.querySelector(`.${selectedLMB._DOMelement}`).classList.remove('selected-ctrl');
			}
		}
	}

	selectedItem.elem = elem;
	selectedItem.downX = e.pageX;
	selectedItem.downY = e.pageY;
	updateEverything();
}

workspace.onmousemove = function(e) {		//процесс перетаскивания элементов (перемещение мыши с зажатым ЛКМ)
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

workspace.onmouseup = function(e) {		//окончание перетаскивания элементов (отспускание ЛКМ)
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
	if (working) {
		if (selectedLMB.getDOM()) {
			notification("Подтверждение", `Вы действительно хотите удалить элемент <i>${findSemanticItem(selectedLMB._DOMelement).data.header}</i>?<br>Удаление элемента вызовет каскад удалений всех связей, связанных с этим элементом`, "Удалить", "Отмена", () => {
				deleteSemanticItem(selectedLMB);
			});
		} else if (selectedConnection) {
			notification("Подтверждение", `Вы действительно хотите удалить элемент <i>${selectedConnection.idA} <i class="fas fa-chevron-right"></i> ${selectedConnection.idB}</i>?`, "Удалить", "Отмена", () => {
				deleteSemanticItem(selectedConnection);
			});
			
		}	else {
			notification("Уведомление","Не выделен элемент для удаления","ОК");
		}
	}
}

deleteButton.addEventListener("click", function() {		//удаление объекта	
	deleteItem();
	updateEverything();
});

connectButton.addEventListener("click", function() {	//создание соединения
	let good = true;
	if (selectedLMB.getDOM() && selectedCTRL.getDOM()) {
		listOfSemanticConnections.forEach(item => {
			if ((selectedLMB._DOMelement === item.idA && selectedCTRL._DOMelement === item.idB) || (selectedCTRL._DOMelement === item.idA && selectedLMB._DOMelement === item.idB)) {
				notification("Ошибка", "Ошибка ввода названия связи. Введите, пожалуйста, название.", "ОК");
				good = false;
			}
		});
		if (good) {
			prepareWindow("connect");
			appearEditWindow();
			updateEverything();
		}
	} else {
		notification("Уведомление","Не выделены два элемента для выделения","ОК");
	}
});

createNewButton.addEventListener("click", function () {		//создание нового элемента
	prepareWindow("create");
	appearEditWindow();
	updateEverything();
});

function appearEditWindow() {		//функция появления окна создания/редактирования элементов
	updateEverything();
	itemPanel.style.display = "block";
	darkBackground.style.display = "block";
	setTimeout(function() {
		darkBackground.classList.add("show");
		itemPanel.classList.add("show");
		working = false;
	}, 50);
}

function hideEditWindow() {		//функция скрытия окна создания/редактирования элементов
	darkBackground.classList.remove("show");
		itemPanel.classList.remove("show");
		document.querySelector(".close-label").style.opacity = "0";
		itemPanel.style.opacity = "0";
	setTimeout(function() {
		itemPanel.style.display = "";
		document.querySelector(".close-label").style.opacity = "";
		itemPanel.style.opacity = "";
		darkBackground.style.display = "";
		itemPanel.innerHTML = "";
		working = true;
	}, 550);
	updateEverything();
}

darkBackground.addEventListener("click", function() {		//закрытие окна создания/редактирования при нажатии за его область
	hideEditWindow();
});

function prepareWindow(changeIdentificator, prepSemanticItem) {		//функция подготовки окна создания/редактирования 
	switch (changeIdentificator) {
		case "edit":
			for (let key in prepSemanticItem.data) {
				if (key == "header") {
					itemPanel.innerHTML += `<h4><i class="fas fa-pen"></i> Редактирование элемента</h4>
																		<h3><input class="data-header selectable" type="text" placeholder="Название" value="${prepSemanticItem.data[key]}" autofocus></h3>
																		<ul class="data-list"></ul>`;
				} else if (key != "top" && key != "left"){
					if (key === "Тип") {
						itemPanel.querySelector("ul").innerHTML += `<li>
																	<input class="data-index selectable" disabled type="text" value='${key}'>
																	<input type="text" class="data-value selectable" placeholder="Название типа" value='${prepSemanticItem.data[key]}'>
																</li>`;
					} else {
						itemPanel.querySelector("ul").innerHTML += `<li>
																	<input class="data-index selectable" type="text" value='${key}'>
																	<input type="text" class="data-value selectable" value='${prepSemanticItem.data[key]}'>
																	<div  class="button sem-data-delete">
																		<i class="fas fa-minus"></i><span>Удалить свойство</span>
																	</div>
																</li>`;
					}
				}
			}
			itemPanel.innerHTML += `<div class="button-place">
										<div id="new-sem-item-data" class="button">
											<i class="fas fa-plus"></i><span>Добавить&nbspсвойство</span>
										</div>
										<div id="sem-done" class="button">
											<i class="fas fa-check"></i><span>Применить</span>
										</div>
									</div>`;
			document.querySelector("#new-sem-item-data").addEventListener("click", function() {
				document.querySelectorAll(".data-index").forEach(function(item) {
					item.defaultValue = item.value;
				});
				document.querySelectorAll(".data-value").forEach(function(item) {
					item.defaultValue = item.value;
				});
				itemPanel.querySelector("ul").innerHTML += `<li>
																<input class="data-index selectable" type="text" value="Index">
																<input type="text" class="data-value selectable"  value="Value">
																<div  class="button sem-data-delete">
																	<i class="fas fa-minus"></i><span>Удалить свойство</span>
																</div>
															</li>`;
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
				adaptivePanel();
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
				adaptivePanel()
			});
			document.querySelector("#sem-done").addEventListener("click", function() {
				for (let key in prepSemanticItem.data) {
					if (key == "header" || key == "top" || key == "left"){
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
				itemValidation(document.querySelector(".data-header").value, listIndex, listValue, () => {
					//проверка на кириллицу
					for (let i = 0; i < listIndex.length; i++) {
						prepSemanticItem.setData(listIndex[i] ,listValue[i])
					}
					hideEditWindow();
				});
			});
			break;
		case "create":
			itemPanel.innerHTML += `<h4><i class="fas fa-plus"></i> Создание элемента</h4>
										<h3>
											<input class="data-header selectable" type="text" value="" placeholder="Название" autofocus>
										</h3>
										<ul class="data-list">
											<li>
												<input class="data-index selectable" type="text" disabled value="Тип">
												<input type="text" class="data-value selectable" placeholder="Название типа"  value="">
											</li>
										</ul>
										<div class="button-place">
											<div id="new-sem-item-data" class="button">
												<i class="fas fa-plus"></i><span>Добавить&nbspсвойство</span>
											</div>
											<div id="sem-done" class="button">
												<i class="fas fa-check"></i><span>Применить</span>
											</div>
										</div>`;
			document.querySelector("#new-sem-item-data").addEventListener("click", function() {
				document.querySelectorAll(".data-index").forEach(function(item) {
					item.defaultValue = item.value;
				});
				document.querySelectorAll(".data-value").forEach(function(item) {
					item.defaultValue = item.value;
				});
				itemPanel.querySelector("ul").innerHTML += `<li>
																		<input class="data-index selectable" type="text" value="Index">
																		<input type="text" class="data-value selectable" value="Value">
																		<div  class="button sem-data-delete">
																			<i class="fas fa-minus"></i><span>Удалить свойство</span>
																		</div>
																	</li>`;
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
				adaptivePanel();
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
				adaptivePanel();
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
				if (itemValidation(document.querySelector(".data-header").value, listIndex, listValue)) {
					//проверка на кириллицу
					for (let i = 0; i < listIndex.length; i++) {
						list[listIndex[i]] = listValue[i];
					}
					createSemanticItem(list);
					hideEditWindow();
				}
			});
			break;
		case "connect":
			itemPanel.innerHTML += `<h4><i class="fas fa-plus"></i> Создание связи ${selectedLMB._DOMelement} <i class="fas fa-chevron-right"></i> ${selectedCTRL._DOMelement}</h4>
																<h3><input class="data-header selectable" type="text" value="" placeholder="Название" autofocus></h3>
																<div class="button-place">
																	<div></div>
																	<div id="sem-done" class="button">
																		<i class="fas fa-check"></i><span>Применить</span>
																	</div>
																</div>`;
			document.getElementById("sem-done").addEventListener("click", () => {
				const type = document.querySelector(".data-header").value;
				if (type) {
					//проверка на кириллицу
					makeConnection(selectedLMB, selectedCTRL, type);
					hideEditWindow();
				} else {
					notification("Ошибка", "Ошибка ввода названия связи. Введите, пожалуйста, название.", "ОК");
				}
			});
			break;
		case "connect-edit":
			itemPanel.innerHTML += `<h4><i class="fas fa-plus"></i> Редактирование связи ${prepSemanticItem.idA} <i class="fas fa-chevron-right"></i> ${prepSemanticItem.idB}</h4>
																<h3><input class="data-header selectable" type="text" value="${prepSemanticItem.typeOfConnection}" placeholder="Название" autofocus></h3>
																<div class="button-place">
																	<div></div>
																	<div id="sem-done" class="button">
																		<i class="fas fa-check"></i><span>Применить</span>
																	</div>
																</div>`;
			document.getElementById("sem-done").addEventListener("click", () => {
				const type = document.querySelector(".data-header").value;
				if (type) {
					//проверка на кириллицу
					prepSemanticItem["typeOfConnection"] = type;
					hideEditWindow();
				} else {
					notification("Ошибка", "Ошибка ввода названия связи. Введите, пожалуйста, название.", "ОК");
				}
			});
			break;
		case "save":
			itemPanel.innerHTML += `<h4><i class="fas fa-save"></i> Сохранение файла</h4>
																<h3><input class="data-header selectable" type="text" value="new_service" placeholder="Название файла" autofocus></h3>
																<div class="button-place">
																	<div></div>
																	<div id="sem-done" class="button">
																		<i class="fas fa-check"></i><span>Применить</span>
																	</div>
																</div>`;
			itemPanel.querySelector("#sem-done").addEventListener("click", () => {
				const name = itemPanel.querySelector(".data-header").value;
				if (name) {
					if (validation()) {
						const res = saveJSONtoXML(JSON.stringify(wriTeOWLFile()));
						const file = new Blob([res], {type: "owl"});
					    const a = document.createElement("a");
					    const url = URL.createObjectURL(file);
						a.href = url;
						a.download = `${name}.owl`;
						document.body.appendChild(a);
						a.click();
						setTimeout(function() {
							document.body.removeChild(a);
							window.URL.revokeObjectURL(url);  
						}, 0);
						hideEditWindow();
					}
				} else {
					notification("Ошибка", "Ошибка ввода названия файла. Введите, пожалуйста, название.", "ОК");
				}
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
		updateEverything();
	} else if (selectedConnection) {
		prepareWindow("connect-edit", selectedConnection);
		appearEditWindow();
		updateEverything();
	} else {
		notification("Уведомление", "Не выбран элемент для редактирования", "ОК");
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
			document.querySelector("#items-list").innerHTML += `<li class="item c${index}">${item.idA} <i class="fas fa-chevron-right"></i> ${item.typeOfConnection} <i class="fas fa-chevron-right"></i> ${item.idB}</li>`;
		});
		document.querySelectorAll("#items-list li").forEach(function(item, index) {
			item.addEventListener("click", function() {
				selectedCTRL.setDOM(null);
				selectedLMB.setDOM(null);
				if (document.querySelector(".selected-lmb")) {
					document.querySelector(".selected-lmb").classList.remove("selected-lmb");
				}
				this.classList.add("selected-lmb");
				selectedConnection = listOfSemanticConnections[index];
			});
		});
	}
}

openButton.addEventListener("click", () => {
	if (itemsCreateCounter !== 0) {
		notification("Уведомление", "При открытии нового файла вы можете утратить несохранённые данные. Продолжить?", "Продолжить", "Отмена",() => {
			document.getElementById('file-input').click();
		});
	} else {
		document.getElementById('file-input').click();
	}
});

document.getElementById('file-input').addEventListener("change", function(e) {
	itemsCreateCounter = 0;
	var files = e.target.files;
    var file = files[0];           
    var reader = new FileReader();
    for(let i = listOfSemanticItems.length - 1; i >= 0; i--) {
    	deleteSemanticItem(listOfSemanticItems[i]);
    }
    itemsCreateCounter = 0;
    listOfSemanticConnections.forEach(function(item) {
    	deleteSemanticItem(item);
    });
    updateEverything();
    reader.onload = function(event) {
    	try {
    		OWLtoJSONfile = loadXMLtoJSON(event.target.result);
	    	if (OWLtoJSONfile) {
		        OWLtoJSONfile = JSON.parse(OWLtoJSONfile);
		        readOWLFile(OWLtoJSONfile);
		        updateEverything();
	    	}
    	} catch (error) {
    		notification("Ошибка", `Ошибка чтения файла:<br>${error}`, "ОК");
    	}
	}
	reader.readAsText(file);
	document.querySelector("#file-input").value = '';
});

function readOWLFile(JSONobject) {
	let quequedConnections;
	const valueID = Object.keys(OWLtoJSONfile.Declaration.find(item => {
		if (item.hasOwnProperty("Class")) {
			return true;
		} else {
			return false;
		}
	}).Class[0])[0];
	JSONobject.Declaration.forEach(function(item) {
		if (item.hasOwnProperty("Class")) {
			createSemanticItem({"header": deleteSharp(item.Class[0][valueID]), "Тип": "Класс"});
		} else if (item.hasOwnProperty("ObjectPropertyAssertion")) {
			//что там?...
		}
	});
	try {
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

		JSONobject.DataPropertyAssertion.forEach(function(item) {
			listOfSemanticItems.forEach(function(semitem) {
				if(deleteSharp(item.NamedIndividual[0][valueID]) == semitem.data.header) {
					if (item.Literal.__text) {
						if (item.DataProperty instanceof Array) {
							semitem.data[deleteSharp(item.DataProperty[0][valueID])] = item.Literal.__text;
						} else {
							semitem.data[deleteSharp(item.DataProperty[valueID])] = item.Literal.__text;
						}
					} else {
						if(item.DataProperty instanceof Array) {
							semitem.data[deleteSharp(item.DataProperty[0][valueID])] = item.Literal;
						} else {
							semitem.data[deleteSharp(item.DataProperty[valueID])] = item.Literal;
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
	catch (error) {
		notification("Ошибка чтения файла", `Файл неполный или повреждён:</br>${error}`, "ОК");
		listOfSemanticItems = [];
		listOfSemanticConnections = [];
		itemsCreateCounter = 0;
		workspace.innerHTML = '';
		updateEverything();
	}	
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
	return JSONobject;
}

saveButton.addEventListener("click", () => {
	prepareWindow("save");
	appearEditWindow();
	updateEverything();
});

function notification(header, argument, OKtext, CanselText, trueCallback, falseCallback) {
	const notificationBackground = document.querySelector(".second-dark-background");
	notificationWindow.innerHTML += `<h4><i class="fas fa-exclamation-triangle"></i> ${header}</h4>
									<h5>${argument}</h5>
									<div class="notification-button-area">
										<button id="true" class="notification-button">${OKtext}</button>
										${CanselText?`<button id="false" class="notification-button">${CanselText}</button>`:''}
									</div>`;
	// попробовать реализовать с помощью css
	switch (header) {
		case "Ошибка":
			notificationWindow.querySelector("h4").style.backgroundColor = "rgb(115, 0, 0)";
			notificationWindow.querySelector("h4").style.color = "rgb(255, 255, 255)";		
			notificationWindow.style.borderColor = "rgb(115, 0, 0)";
			break;
		case "Уведомление":
			notificationWindow.querySelector("h4").style.backgroundColor = "rgb(220, 220, 0)";
			notificationWindow.querySelector("h4").style.color = "rgb(0, 0, 0)";		
			notificationWindow.style.borderColor = "rgb(220, 220, 0)";
			break;
		default:
			notificationWindow.querySelector("h4").style.backgroundColor = "";
			notificationWindow.querySelector("h4").style.color = "";		
			notificationWindow.style.borderColor = "";
	}
	notificationWindow.style.display = "block";
	notificationBackground.style.display = "block";
	updateEverything();
	setTimeout(function() {
		notificationBackground.style.opacity = "0.5";
		notificationWindow.style.opacity = "1";
		notificationWindow.style.transform = "scale(1)";
		
	}, 50);
	document.getElementById("true").addEventListener("click", () => {
		notificationBackground.style.opacity = "";
		notificationWindow.style.opacity = "";
		notificationWindow.style.transform = "";
		setTimeout(function() {
			notificationWindow.style.transform = "";
			notificationWindow.style.display = "";
			notificationBackground.style.display = "";
			notificationWindow.innerHTML = "";
			if (trueCallback) {
				trueCallback();
			}
		}, 550);
	});
	if (CanselText) {
		document.getElementById("false").addEventListener("click", () => {
			notificationBackground.style.opacity = "";
			notificationWindow.style.opacity = "";
			notificationWindow.style.transform = "";
			setTimeout(function() {
				notificationWindow.style.transform = "";
				notificationWindow.style.display = "";
				notificationBackground.style.display = "";
				notificationWindow.innerHTML = "";
				if (falseCallback) {
					falseCallback();
				}
			}, 550);
		});
	}
}

function itemValidation(header, listIndex, listValue) {
	let notificationText = '';
	let hasError = false;
	if (!header) {
		notificationText += "Ошибка в вводе заголовка элемента";
		notificationText += "<br>";
		hasError = true;
	}
	if (!listIndex.length || !listValue.length || listIndex.length != listValue.length) {
		notificationText += "Ошибка в организации имён параметров с их значениями";
		notificationText += "<br>";
		hasError = true;
	}
	if (!(listValue[0] == "Класс" || listValue[0] == "Объект класса")) {
		notificationText += "Ошибка в задании параметра \"Тип\". Допускается только \"Класс\" или \"Объект класса\"";
		notificationText += "<br>";
		hasError = true;
	}
	if (listValue.indexOf('') != -1 || listIndex.indexOf('') != -1) {
		notificationText += "Не допускается задание пустых строк в названии параметров и их параметрах";
		notificationText += "<br>";
		hasError = true;
	}
	if (sameElements(listIndex)) {
		notificationText += "Не допускается одинаковые имена параметров объекта";
		notificationText += "<br>";
		hasError = true;
	}
	if (hasError) {
		notification("Ошибка", notificationText, "ОК");
	}
	return !hasError;
};

toggleScale.addEventListener("click", () => {
	const body = document.querySelector("body");
	if (body.classList.contains("scale-out")) {
		body.classList.remove("scale-out");
		toggleScale.querySelector("span").innerText = "Отдалить";
		listOfSemanticItems.forEach(item => {
			item.data.top = `${parseInt(item.data.top)*(1/multiplier)}px`;
			item.data.left = `${parseInt(item.data.left)*(1/multiplier)}px`;
			document.getElementById(item._DOMelement).style.left = item.data.left;
			document.getElementById(item._DOMelement).style.top = item.data.top;
		});
		multiplier = 1;
	} else {
		body.classList.add("scale-out");
		toggleScale.querySelector("span").innerText = "Приблизить";
		multiplier = 0.7;
		listOfSemanticItems.forEach(item => {
			item.data.top = `${parseInt(item.data.top)*multiplier}px`;
			item.data.left = `${parseInt(item.data.left)*multiplier}px`;
			document.getElementById(item._DOMelement).style.left = item.data.left;
			document.getElementById(item._DOMelement).style.top = item.data.top;
		});
	}
	updateEverything();
});

function validation() {
	let notificationText = '';
	let listOfHeaders = [];
	let allGood = true;
	let ind = false;
	listOfSemanticItems.forEach((item1, index1) => {
		listOfHeaders.push(item1.data.header);
		if (item1.data["Тип"] === "Класс") {
			listOfSemanticConnections.forEach(conn => {
				if (conn.idA === item1._DOMelement && findSemanticItem(conn.idB).data["Тип"] === "Класс") {
					if (conn.typeOfConnection !== "Является подклассом") {
						notificationText += `Cвязи между классами <i>${item1.data.header}</i> и <i>${findSemanticItem(conn.idB).data.header}</i> могут быть только типа "Является подклассом"`;
						notificationText += '<br>';
						allGood = false;
					}
				}
			});
			for (let key in item1.data) {
				if (key !== "header" && key !== "Тип" && key !== "top" && key !== "left") {
					notificationText += `В классе <i>${item1.data.header}</i> не может быть параметра ${key}`;
					notificationText += '<br>';
					allGood = false;
				}
			} 
		} else if (item1.data["Тип"] === "Объект класса") {
			ind = 0;
			listOfSemanticConnections.forEach(conn => {
				if (conn.idA === item1._DOMelement && findSemanticItem(conn.idB).data["Тип"] === "Класс") {
					ind++;
				}
			});
			if (ind == 0) {
				notificationText += `Объект класса <i>${item1.data.header}</i> должен быть связан типом "Является объектом класса"`;
				notificationText += '<br>';
				allGood = false;
			} else if (ind > 1) {
				notificationText += `Объект класса <i>${item1.data.header}</i> не может иметь более одной связи "Является объектом класса"`;
				notificationText += '<br>';
				allGood = false;
			}
		}	
	});
	listOfSemanticConnections.forEach(conn => {
		if (conn.typeOfConnection === "Является подклассом") {
			if (findSemanticItem(conn.idA).data["Тип"] !== "Класс" || findSemanticItem(conn.idB).data["Тип"] !== "Класс") {
				notificationText += `Cвязи между <i>${findSemanticItem(conn.idA).data.header}</i> и <i>${findSemanticItem(conn.idB).data.header}</i> типа "Является подклассом" невозможна, так как данный тип связи допустим только между двумя Классами.`;
				notificationText += '<br>';
				allGood = false;
			}
		} else if (conn.typeOfConnection === "Является объектом класса") {
			if (findSemanticItem(conn.idA).data["Тип"] !== "Объект класса" || findSemanticItem(conn.idB).data["Тип"] !== "Класс") {
				notificationText += `Связи <i>${conn.idA} <i class="fas fa-chevron-right"></i> ${conn.idB}</i> (Является объектом класса) могут отходить только от объекта типа "Объект класса" к объекту "Класс"`;
				notificationText += '<br>';
				allGood = false;
			}
		}
	});
	if (sameElements(listOfHeaders)) {
		notificationText += `Одинаковые названия объектов запрещены`;
		notificationText += '<br>';
		allGood = false;
	}
	if (!allGood) {
		notification("Ошибка", notificationText, "ОК");
	}
	return allGood;
}