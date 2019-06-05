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

function getCoords(avatar) {		//функция получения координат при перемещении
	let coords = {
		left: '',
		top: ''
	}
	coords.top = parseInt(avatar.style.top);
	coords.left = parseInt(avatar.style.left);
	return coords;
}

function upadteLength(array) {		//Пересчёт и группировка массива. Необходим при удалении элементов
	array.sort();
	let i = 0;
	array.forEach(function() {
		i++;
	});
	array.length = i;
}

function deleteSharp(stringSh) {
	return stringSh.replace('#','');
}

function addSharp(stringSh) {
	return '#' + stringSh;
}

function sameElements(array) {
	array.forEach((item, i) => {
		array.forEach((jtem, j) => {
			if (i != j) {
				if (item === jtem) {
					return true;
				}
			}
		});
	});
	return false;
};

function cyrillicCheck(argument) {
	if( argument.search(/[А-яЁё]/) === -1 ) {
		return false;
	} else {
		return true;
	}
}