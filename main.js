var mysql = require("mysql");
var con = mysql.createConnection( {
	host: "127.0.0.1",
	user: "admin",
	password: "admin",
	database : "taskworld"
});
/*
database: taskworld

CREATE TABLE `game_info` (
`game_id` varchar(50) NOT NULL,
`action_number` int(11) NOT NULL,
`action` varchar(30) NOT NULL,
`coordinate_x` int(11) NOT NULL,
`coordinate_y` int(11) NOT NULL,
`result` varchar(30) NOT NULL,
`ship_type` varchar(30) DEFAULT NULL,
`direction` varchar(30) DEFAULT NULL,
PRIMARY KEY (`game_id`, `action_number`)
)
*/
con.connect(function(err) {
	if(err) {
		throw err;
	}
	console.log("Connected to taskworld");
});

var debugMode = true;
var express = require("express");
var app = express();
var game_id_count = 0;
app.use(express.static(__dirname + "/public"))

var game = {
	id: "Game ID:" + Math.floor(Math.random() * 100) + " " + new Date(),
	state: 0, // start 0 >> attack 1 >> over 2
	hitPoint: 20,
	missPoint: 0,
	shipUse: ["Battleship", "Cruisers", "Destroyers", "Submarines"],
	shipCount: 10,
	broad: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
	log: ["Start"],
	step: 0
}

function callSQL(sql) {
	con.query(sql, function (err, result) {
		if(err) {
			throw err;
		}
	});
}

function insertAttackLog(coordinate_y, coordinate_x, shipType, result) {
	var sql = ["INSERT INTO `game_info` (`game_id`, `action_number`, `action`, `coordinate_x`, `coordinate_y`, `ship_type`, `result`) VALUES ('"];
	var values = [game.id, game.step, "attack", coordinate_x, coordinate_y, shipType, result];
	sql = sql + values.join("', '") + "');";
	
	callSQL(sql);
}

function insertPlaceShipLog(coordinate_y, coordinate_x, shipType, direction, result) {
	var sql = ["INSERT INTO `game_info` (`game_id`, `action_number`, `action`, `coordinate_x`, `coordinate_y`, `ship_type`, `direction`, `result`) VALUES ('"];
	var values = [game.id, game.step, "place ship", coordinate_x, coordinate_y, shipType, direction, result];
	sql = sql + values.join("', '") + "');";
	
	callSQL(sql);
}

var server = app.listen(8081, function () {
	var host = "127.0.0.1";
	var port = server.address().port;

	console.log("Battleship app listening at http:// " + host + ":" + port);
})

function init() {
	game_id_count++;
	game.id = "Game ID:" + game_id_count + " " + new Date();
	game.state = 0,
	game.hitPoint = 20;
	game.missPoint = 0;
	game.shipUse["Battleship"] = 1;
	game.shipUse["Cruisers"] = 2;
	game.shipUse["Destroyers"] = 3;
	game.shipUse["Submarines"] = 4;
	game.shipCount = 10;
	game.log = ["Start"];
	game.step = 0;
	for (i = 0; i < 10; i++) {
		game.broad[i] = ["~", "~", "~", "~", "~", "~", "~", "~", "~", "~"];
	}
	
	console.log("Game reset");
}

function print() {
	var printText = ["debug mode on:" + debugMode + "<br>Line:<br>1 2 3 4 5 6 7 8 9 10<br>"];
	for (i = 0; i < 10; i++) {
		printText = printText.concat(game.broad[i]).concat("Row " + (i + 1)).concat("<br>");
	}
	return printText.concat(game.log.join("<br>")).join(" ");
}

function addLog(actionLog) {
	game.step++;
	game.log = game.log.concat("step:" + game.step + " >> " + actionLog);
}

function doAttack(coordinate_y, coordinate_x) {
	var actionLog = "attack at [" + coordinate_x + ", " + coordinate_y + "]";
	var shipType = "error";
	var result = "error";
	var respone = "error";
	var error = false;
	
	// check game state
	if(game.state == 0) {
		actionLog = actionLog.concat(" [Error game state: please place all ship before start attacking]");
		error = true;
	}else if(game.state == 2) {
		actionLog = actionLog.concat(" [Error game state: game over]");
		error = true;
	}
	
	// check coordinate
	if(!error) {
		if(coordinate_x > 10 || coordinate_x < 1 || coordinate_y > 10 || coordinate_y < 1) {
			actionLog = actionLog.concat(" [Error wrong coordinate: out of map]");
			error = true;
		}else if("x".localeCompare(game.broad[coordinate_y-1][coordinate_x-1]) == 0) {
			actionLog = actionLog.concat(" [Error wrong coordinate: already shoot]");
			error = true;
		}else if("X".localeCompare(game.broad[coordinate_y-1][coordinate_x-1]) == 0) {
			actionLog = actionLog.concat(" [Error wrong coordinate: already shoot]");
			error = true;
		}else {
			if("~".localeCompare(game.broad[coordinate_y-1][coordinate_x-1]) == 0) { // miss
				actionLog = actionLog.concat(" Miss");
				game.broad[coordinate_y-1][coordinate_x-1] = "x";
				game.missPoint++;
				shipType = "ocean";
				result = "miss";
				respone = "Miss";
			}else { // hit
				var ship = getShipType(game.broad[coordinate_y-1][coordinate_x-1]);
				shipType = ship;
				result = "hit";
				respone = "Hit";
				game.hitPoint--;
				actionLog = actionLog.concat(" Hit");
				game.broad[coordinate_y-1][coordinate_x-1] = "X"; // mark as fired
				
				if(isShipDestroy(ship, coordinate_x-1, coordinate_y-1) == 0) {
					actionLog = actionLog.concat("<br>You just sank the " + ship + ".");
					result = "hit and sink";
				respone = "You just sank the " + ship;
				}
				
				if(game.hitPoint == 0) { // end game
					actionLog = actionLog.concat("<br>Game over Miss:" + game.missPoint);
					game.state = 2;
					result = "hit and game over";
					respone = "Game over";
				}
			}
		}
	}
	
	console.log(actionLog);
	addLog(actionLog);
	insertAttackLog(coordinate_y, coordinate_x, shipType, result);
	return respone;
}

function isShipDestroy(ship, hitX, hitY) {
	var shipC = ship.charAt(0);
	var shipLife = 0;
	if("Battleship".localeCompare(ship) == 0) {
		shipLife = 3;
	}
	else if("Cruisers".localeCompare(ship) == 0) {
		shipLife = 2;
	}
	else if("Destroyers".localeCompare(ship) == 0) {
		shipLife = 1;
	}
	else {
		return 0;
	}
	
	// check Left
	if(shipLife > 0) {
		var i = 1;
		while(hitX - i >= 0) {
			if(shipC.localeCompare(game.broad[hitY][hitX - i]) == 0) {
				return shipLife;
			}
			else if("x".localeCompare(game.broad[hitY][hitX - i]) == 0) { // stop
				break;
			}
			else if("~".localeCompare(game.broad[hitY][hitX - i]) == 0) { // stop
				break;
			}
			else if("X".localeCompare(game.broad[hitY][hitX - i]) == 0) {
				shipLife--;
			}
			i++;
		}
	}
	
	// check Right
	if(shipLife > 0) {
		var i = 1;
		while(hitX + i < 10) {
			if(shipC.localeCompare(game.broad[hitY][hitX + i]) == 0) {
				return shipLife;
			}
			else if("x".localeCompare(game.broad[hitY][hitX + i]) == 0) { // stop
				break;
			}
			else if("~".localeCompare(game.broad[hitY][hitX + i]) == 0) { // stop
				break;
			}
			else if("X".localeCompare(game.broad[hitY][hitX + i]) == 0) {
				shipLife--;
			}
			i++;
		}
	}
	
	// check Top
	if(shipLife > 0) {
		var i = 1;
		while(hitY - i >= 0) {
			if(shipC.localeCompare(game.broad[hitY - i][hitX]) == 0) {
				return shipLife;
			}
			else if("x".localeCompare(game.broad[hitY - i][hitX]) == 0) { // stop
				break;
			}
			else if("~".localeCompare(game.broad[hitY - i][hitX]) == 0) { // stop
				break;
			}
			else if("X".localeCompare(game.broad[hitY - i][hitX]) == 0) {
				shipLife--;
			}
			i++;
		}
	}
	
	// check Down
	if(shipLife > 0) {
		var i = 1;
		while(hitY + i<10) {
			if(shipC.localeCompare(game.broad[hitY + i][hitX]) == 0) {
				return shipLife;
			}
			else if("x".localeCompare(game.broad[hitY + i][hitX]) == 0) { // stop
				break;
			}
			else if("~".localeCompare(game.broad[hitY + i][hitX]) == 0) { // stop
				break;
			}
			else if("X".localeCompare(game.broad[hitY + i][hitX]) == 0) {
				shipLife--;
			}
			i++;
		}
	}
		
	return shipLife;
}

function getShipType(point) {
	if("B".localeCompare(point) == 0){
		return "Battleship"
	}
	else if("C".localeCompare(point) == 0){
		return "Cruisers"
	}
	else if("D".localeCompare(point) == 0){
		return "Destroyers"
	}
	return "Submarines"
}

function doPlaceShip(ship, coordinate_y, coordinate_x, direction) {
	var error = false;
	var actionLog = "Set ship:" + ship + " at [" + coordinate_x + ", " + coordinate_y + "] direction:" + direction;
	var shipLong = 0; // index long
	var shipArea_x = 0;
	var shipArea_y = 0;
	
	// check game state
	if(game.state == 1) {
		actionLog = actionLog.concat(" [Error game state: all ship already placed]");
		error = true;
	}else if(game.state == 2) {
		actionLog = actionLog.concat(" [Error game state: game over]");
		error = true;
	}
	
	// check ship
	if(!error){
		if("Battleship".localeCompare(ship) == 0) {
			if(parseInt(game.shipUse["Battleship"]) > 0) {
				shipLong = 3;
			}else {
				actionLog = actionLog.concat(" [Error out of ship type:Battleship]");
				// addLog(actionLog);
				// return;
				error = true;
			}
		}else if("Cruisers".localeCompare(ship) == 0) {
			if(parseInt(game.shipUse["Cruisers"]) > 0) {
				shipLong = 2;
			}else {
				actionLog = actionLog.concat(" [Error out of ship type:Cruisers]");
				// addLog(actionLog);
				// return;
				error = true;
			}
		}else if("Destroyers".localeCompare(ship) == 0) {
			if(parseInt(game.shipUse["Destroyers"]) > 0) {
				shipLong = 1;
			}else {
				actionLog = actionLog.concat(" [Error out of ship type:Destroyers]");
				// addLog(actionLog);
				// return;
				error = true;
			}
		}else if("Submarines".localeCompare(ship) == 0) {
			if(parseInt(game.shipUse["Submarines"]) > 0) {
				shipLong = 0;
			}else {
				actionLog = actionLog.concat(" [Error out of ship type:Submarines]");
				// addLog(actionLog);
				// return;
				error = true;
			}
		}else {
			actionLog = actionLog.concat(" [Error ship type:").concat(ship).concat("]");
			// addLog(actionLog);
			// return;
			error = true;
		}
	}
	// check coordinate
	if(!error){
		if(coordinate_x > 10 || coordinate_x < 1 || coordinate_y > 10 || coordinate_y < 1) {
			actionLog = actionLog.concat(" [Error wrong coordinate]");
			// addLog(actionLog);
			// return;
			error = true;
		}else if("vertical".localeCompare(direction) == 0) {
			if(parseInt(coordinate_y) + parseInt(shipLong) > 10 ) {
				actionLog = actionLog.concat(" [Error ship out of map" + (parseInt(coordinate_y) + parseInt(shipLong)) + "]");
				// addLog(actionLog);
				// return;
				error = true;
			}
			
			shipArea_y = parseInt(shipLong);
		}else if("horizontal".localeCompare(direction) == 0) {
			if(parseInt(coordinate_x) + parseInt(shipLong) > 10) {
				actionLog = actionLog.concat(" [Error ship out of map " + (parseInt(coordinate_x) + parseInt(shipLong)) + "]");
				// addLog(actionLog);
				// return;
				error = true;
			}
			
			shipArea_x = parseInt(shipLong);
		}else {
			actionLog = actionLog.concat(" [Error direction:").concat(direction).concat("]");
			// addLog(actionLog);
			// return;
			error = true;
		}
	}
	
	// check too near
	if(!error) {
		shipArea_x = parseInt(shipArea_x) + parseInt(coordinate_x) + 1;
		shipArea_y = parseInt(shipArea_y) + parseInt(coordinate_y) + 1;
		// to index
		for(i = parseInt(coordinate_y)-2 < 0 ? 0 : parseInt(coordinate_y)-2 ; i < (parseInt(shipArea_y) > 9 ? 9 : parseInt(shipArea_y)) ; i++) {
			for(j = parseInt(coordinate_x)-2 < 0 ? 0 : parseInt(coordinate_x)-2 ; j < (parseInt(shipArea_x) > 9 ? 9 : parseInt(shipArea_x)) ; j++) {
				if("~".localeCompare(game.broad[i][j])!= 0) {
					actionLog = actionLog.concat(" [Error ship is too near to each other] [" + i + ", " + j + "] [" + game.broad[i][j] + "]");
					// addLog(actionLog);
					// return;
					error = true;
				}
			}
		}
	}
	
	// place ship
	if(!error) {
		var shipC = ship.charAt(0);
		if("vertical".localeCompare(direction) == 0) {
			for(i = parseInt(coordinate_y)-1; i <= parseInt(coordinate_y) + parseInt(shipLong)-1; i++) {
				game.broad[i][parseInt(coordinate_x)-1] = shipC;
			}
		}else if("horizontal".localeCompare(direction) == 0) {
			for(j = parseInt(coordinate_x)-1; j <= parseInt(coordinate_x) + parseInt(shipLong)-1; j++) {
				game.broad[parseInt(coordinate_y)-1][j] = shipC;
			}
		}
	}
	// reduce ship
	if(!error) {
		game.shipUse[ship] = parseInt(game.shipUse[ship]) - 1;
		game.shipCount--;
		if(game.shipCount == 0) {
			game.state = 1;
			actionLog = actionLog.concat("<br>Start attack phase.");
		}
	}

	console.log(actionLog);
	addLog(actionLog);
	insertPlaceShipLog(coordinate_y, coordinate_x, ship, direction, error ? "success" : "fail");
	return error;
}

// start ----------------------------------------------------------------------------
// first initial;
init();
app.get("/", function (req, res) {
	res.send(print());
});

app.get("/reset", function (req, res) {
	init();
	game.log = ["reset successfully"];
	if(debugMode) {
		res.send(print());
	}else {
		res.send("reset successfully");
	}
});

app.get("/set_attack", function (req, res) {
res.sendFile( __dirname + "/" + "attack.html" );
});

app.get("/attack", function (req, res) {
	var coordinate_x = req.query.coordinate_x;
	var coordinate_y = req.query.coordinate_y;
	
	var respone = doAttack(coordinate_y, coordinate_x);
		
	if(debugMode) {
		res.send(print());
	}else {
		res.send(respone);
	}
});

app.get("/set_ship", function (req, res) {
res.sendFile( __dirname + "/" + "ship.html" );
});

app.get("/ship", function (req, res) {
	var ship = req.query.ship_type;
	var coordinate_x = req.query.coordinate_x;
	var coordinate_y = req.query.coordinate_y;
	var direction = req.query.direction;
	
	var respone = doPlaceShip(ship, coordinate_y, coordinate_x, direction);
		
	if(debugMode) {
		res.send(print());
	}else {
		if(respone) {
			res.send("error");
		}else {
			res.send("placed " + ship);
		}
	}
});

app.get("/debug_on", function (req, res) {
	res.send("debug mode is on");
	debugMode = true;
});

app.get("/debug_off", function (req, res) {
	res.send("debug mode is off");
	debugMode = false;
});

 // TEST ----------------------------------------------------------------------------
function placeDemo() {
	doPlaceShip("Battleship", 1, 1, "vertical");
	doPlaceShip("Cruisers", 1, 3, "vertical");
	doPlaceShip("Cruisers", 6, 4, "horizontal");
	doPlaceShip("Destroyers", 6, 1, "horizontal");
	doPlaceShip("Destroyers", 2, 7, "horizontal");
	doPlaceShip("Destroyers", 8, 2, "horizontal");
	doPlaceShip("Submarines", 8, 5, "horizontal");
	doPlaceShip("Submarines", 10, 5, "horizontal");
	doPlaceShip("Submarines", 10, 1, "horizontal");
	doPlaceShip("Submarines", 10, 10, "horizontal");
}

function attackDemo() {
	doAttack(1, 1);
	doAttack(2, 1);
	doAttack(3, 1);
	doAttack(4, 1);
	doAttack(1, 3);
	doAttack(2, 3);
	doAttack(3, 3);
	doAttack(2, 7);
	doAttack(2, 8);
	doAttack(6, 1);
	doAttack(6, 2);
	doAttack(6, 4);
	doAttack(6, 5);
	doAttack(6, 6);
	doAttack(8, 2);
	doAttack(8, 3);
	doAttack(8, 5);
	doAttack(10, 1);
	doAttack(10, 5);
	doAttack(10, 10);
}

function test_addTwoSubmarines(x1, y1, x2, y2) {
	init();
	doPlaceShip("Submarines", y1, x1, "vertical");
	return doPlaceShip("Submarines", y2, x2, "vertical");
}

function test_tooMuchShip(ship) {
	init();
	var totalShip = parseInt(game.shipUse[ship]);
	var count = 1;
	var index = 1
	var pass = true;
	while(!doPlaceShip(ship, 1, index, "vertical")) {
		count++;
		index += 2;
	}
	console.log("Test on: " + ship + " totalShip:" + totalShip + " count:" + count + " lastIndex:" + index);
	if(count == totalShip + 1) {
		return true;
	}
	return false;
}

app.get("/test/demo_place", function (req, res) {
	placeDemo();
	res.send(print());
});

app.get("/test/demo_place_attack", function (req, res) {
	placeDemo();
	attackDemo();
	
	res.send(print());
});

app.get("/test/demo_place_attack_miss_error", function (req, res) {
	doPlaceShip("Battleship", 1, 1, "vertical");
	doPlaceShip("Battleship", 3, 3, "vertical"); // error out of ship
	doPlaceShip("Cruisers", 1, 3, "vertical");
	doPlaceShip("Cruisers", 1, 1, "vertical"); // error too near
	doPlaceShip("Cruisers", 1, 2, "vertical"); // error too near
	doPlaceShip("Cruisers", 6, 4, "horizontal");
	doPlaceShip("Cruisers", 4, 6, "horizontal"); // error out of ship
	doPlaceShip("Destroyers", 6, 1, "horizontal");
	doPlaceShip("Destroyers", 2, 7, "horizontal");
	doPlaceShip("Destroyers", 8, 2, "horizontal");
	doPlaceShip("Submarines", 8, 5, "horizontal");
	doPlaceShip("Submarines", 10, 5, "horizontal");
	doPlaceShip("Submarines", 10, 1, "horizontal");
	doPlaceShip("Submarines", 10, 10, "horizontal");
	
	// random attack
	doAttack(3, 1);
	doAttack(3, 2);
	doAttack(3, 3);
	doAttack(3, 4);
	doAttack(3, 5);
	doAttack(3, 6);
	doAttack(3, 7);
	doAttack(3, 8);
	doAttack(3, 9);
	doAttack(3, 10);
	doAttack(7, 1);
	doAttack(7, 2);
	doAttack(7, 3);
	doAttack(7, 4);
	doAttack(7, 5);
	doAttack(7, 6);
	doAttack(7, 7);
	doAttack(7, 8);
	doAttack(7, 9);
	doAttack(7, 10);
	doAttack(1, 3);
	doAttack(2, 3);
	doAttack(3, 3); // error alread attack
	doAttack(4, 3);
	doAttack(5, 3);
	doAttack(6, 3);
	doAttack(7, 3); // error alread attack
	doAttack(8, 3);
	doAttack(9, 3);
	doAttack(10, 3);
	doAttack(1, 7);
	doAttack(2, 7);
	doAttack(3, 7); // error alread attack
	doAttack(4, 7);
	doAttack(5, 7);
	doAttack(6, 7);
	doAttack(7, 7); // error alread attack
	doAttack(8, 7);
	doAttack(9, 7);
	doAttack(10, 7);

	// hit attack
	doAttack(1, 1);
	doAttack(2, 1);
	doAttack(3, 1); // error alread attack
	doAttack(4, 1);
	doAttack(1, 3); // error alread attack
	doAttack(2, 3); // error alread attack
	doAttack(3, 3); // error alread attack
	doAttack(2, 7); // error alread attack
	doAttack(2, 8);
	doAttack(6, 1);
	doAttack(6, 2);
	doAttack(6, 4);
	doAttack(6, 5);
	doAttack(6, 6);
	doAttack(8, 2);
	doAttack(8, 3); // error alread attack
	doAttack(8, 5);
	doAttack(10, 1);
	doAttack(10, 5);
	doAttack(10, 10);
	
	res.send(print());
});

app.get("/test/demo_attack", function (req, res) {
	attackDemo();
	res.send(print());
});

app.get("/test/demo_attack_miss", function (req, res) {
	doAttack(5, 1);
	doAttack(5, 7);
	doAttack(3, 9);
	doAttack(6, 10);
	doAttack(10, 7);
	
	res.send(print());
});

app.get("/test/all", function (req, res) {
	init();
	var testLog = ["start test"];
	
	testLog = testLog.concat("<br>> Test place ship out of map");
	testLog = testLog.concat(">> Test place Submarines over the Left of map");
	testLog = testLog.concat(">>> " + (doPlaceShip("Submarines", 5, -5, "vertical") ? "PASS" : "FAIL"));
	testLog = testLog.concat(">> Test place Submarines over the Right of map");
	testLog = testLog.concat(">>> " + (doPlaceShip("Submarines", 5, 15, "vertical") ? "PASS" : "FAIL"));
	testLog = testLog.concat(">> Test place Submarines over the Top of map");
	testLog = testLog.concat(">>> " + (doPlaceShip("Submarines", -5, 5, "vertical") ? "PASS" : "FAIL"));
	testLog = testLog.concat(">> Test place Submarines over the Down of map");
	testLog = testLog.concat(">>> " + (doPlaceShip("Submarines", 15, 5, "vertical") ? "PASS" : "FAIL"));
	testLog = testLog.concat(">> Test place Battleship in map edge with some part out of map on the Left");
	testLog = testLog.concat(">>> " + (doPlaceShip("Battleship", 5, -2, "horizontal") ? "PASS" : "FAIL"));
	testLog = testLog.concat(">> Test place Battleship in map edge with some part out of map on the Right");
	testLog = testLog.concat(">>> " + (doPlaceShip("Battleship", 5, 8, "horizontal") ? "PASS" : "FAIL"));
	testLog = testLog.concat(">> Test place Battleship in map edge with some part out of map on the Top");
	testLog = testLog.concat(">>> " + (doPlaceShip("Battleship", -2, 5, "vertical") ? "PASS" : "FAIL"));
	testLog = testLog.concat(">> Test place Battleship in map edge with some part out of map on the Down");
	testLog = testLog.concat(">>> " + (doPlaceShip("Battleship", 8, 5, "vertical") ? "PASS" : "FAIL"));
	
	testLog = testLog.concat("<br>> Test add over ship number");
	testLog = testLog.concat(">> Test Battleship");
	testLog = testLog.concat(">>> " + (test_tooMuchShip("Battleship") ? "PASS" : "FAIL"));
	testLog = testLog.concat(">> Test Cruisers");
	testLog = testLog.concat(">>> " + (test_tooMuchShip("Cruisers") ? "PASS" : "FAIL"));
	testLog = testLog.concat(">> Test Destroyers");
	testLog = testLog.concat(">>> " + (test_tooMuchShip("Destroyers") ? "PASS" : "FAIL"));
	testLog = testLog.concat(">> Test Submarines");
	testLog = testLog.concat(">>> " + (test_tooMuchShip("Submarines") ? "PASS" : "FAIL"));
	
	testLog = testLog.concat("<br>> Test place ship too near");
	testLog = testLog.concat(">> Left side");
	testLog = testLog.concat(">>> " + (test_addTwoSubmarines(5, 5, 4, 5) ? "PASS" : "FAIL"));
	testLog = testLog.concat(">> Right side");
	testLog = testLog.concat(">>> " + (test_addTwoSubmarines(5, 5, 6, 5) ? "PASS" : "FAIL"));
	testLog = testLog.concat(">> Top side");
	testLog = testLog.concat(">>> " + (test_addTwoSubmarines(5, 5, 5, 4) ? "PASS" : "FAIL"));
	testLog = testLog.concat(">> Down side");
	testLog = testLog.concat(">>> " + (test_addTwoSubmarines(5, 5, 5, 6) ? "PASS" : "FAIL"));
	
	testLog = testLog.concat("<br>> Test place ship in attack phrase");
	init();
	placeDemo();
	testLog = testLog.concat(">>> " + (doPlaceShip("Submarines", 1, 5, "vertical") ? "PASS" : "FAIL"));
		
	testLog = testLog.concat("<br>> Test attack in place ship phrase");
	init();	
	testLog = testLog.concat(">>> " + (doAttack(5, 5).localeCompare("error") == 0 ? "PASS" : "FAIL"));
	
	testLog = testLog.concat("<br>> Test attack out of map");
	init();
	placeDemo();
	testLog = testLog.concat(">> Left side");
	testLog = testLog.concat(">>> " + (doAttack(5, -5).localeCompare("error") == 0 ? "PASS" : "FAIL"));
	testLog = testLog.concat(">> Right side");
	testLog = testLog.concat(">>> " + (doAttack(5, 15).localeCompare("error") == 0 ? "PASS" : "FAIL"));
	testLog = testLog.concat(">> Top side");
	testLog = testLog.concat(">>> " + (doAttack(-5, 5).localeCompare("error") == 0 ? "PASS" : "FAIL"));
	testLog = testLog.concat(">> Down side");
	testLog = testLog.concat(">>> " + (doAttack(15, 5).localeCompare("error") == 0 ? "PASS" : "FAIL"));
		
	testLog = testLog.concat("<br>> Test attack same point");
	init();
	placeDemo();
	testLog = testLog.concat(">> first hit");
	testLog = testLog.concat(">>> " + (doAttack(1, 1).localeCompare("Hit") == 0 ? "PASS" : "FAIL"));
	testLog = testLog.concat(">> second hit");
	testLog = testLog.concat(">>> " + (doAttack(1, 1).localeCompare("error") == 0 ? "PASS" : "FAIL"));
	testLog = testLog.concat(">> first miss");
	testLog = testLog.concat(">>> " + (doAttack(1, 2).localeCompare("Miss") == 0 ? "PASS" : "FAIL"));
	testLog = testLog.concat(">> second miss");
	testLog = testLog.concat(">>> " + (doAttack(1, 2).localeCompare("error") == 0 ? "PASS" : "FAIL"));
	
	testLog = testLog.concat("<br>> Test kill ship");
	init();
	placeDemo();
	testLog = testLog.concat(">> Test Battleship");
	doAttack(1, 1);
	doAttack(2, 1);
	doAttack(3, 1);
	testLog = testLog.concat(">>> " + (doAttack(4, 1).localeCompare("You just sank the Battleship") == 0 ? "PASS" : "FAIL"));
	testLog = testLog.concat(">> Test Cruisers");
	doAttack(1, 3);
	doAttack(2, 3);
	testLog = testLog.concat(">>> " + (doAttack(3, 3).localeCompare("You just sank the Cruisers" == 0) ? "PASS" : "FAIL"));
	testLog = testLog.concat(">> Test Destroyers");
	doAttack(2, 7);
	testLog = testLog.concat(">>> " + (doAttack(2, 8).localeCompare("You just sank the Destroyers") == 0 ? "PASS" : "FAIL"));
	testLog = testLog.concat(">> Test Submarines");
	testLog = testLog.concat(">>> " + (doAttack(10, 10).localeCompare("You just sank the Submarines") == 0 ? "PASS" : "FAIL"));
	
	testLog = testLog.concat("<br>> Test game over");
	init();
	placeDemo();
	doAttack(1, 1);
	doAttack(2, 1);
	doAttack(3, 1);
	doAttack(4, 1);
	doAttack(1, 3);
	doAttack(2, 3);
	doAttack(3, 3);
	doAttack(2, 7);
	doAttack(2, 8);
	doAttack(6, 1);
	doAttack(6, 2);
	doAttack(6, 4);
	doAttack(6, 5);
	doAttack(6, 6);
	doAttack(8, 2);
	doAttack(8, 3);
	doAttack(8, 5);
	doAttack(10, 1);
	doAttack(10, 5);
	testLog = testLog.concat(">>> " + (doAttack(10, 10).localeCompare("Game over") == 0 ? "PASS" : "FAIL"));
	
	testLog = testLog.concat("<br>> Test place ship after game over");
	testLog = testLog.concat(">>> " + (doPlaceShip("Submarines", 4, 9, "vertical") ? "PASS" : "FAIL"));
	
	testLog = testLog.concat("<br>> Test attack after game over");
	testLog = testLog.concat(">>> " + (doAttack(9, 9).localeCompare("error") == 0 ? "PASS" : "FAIL"));
		
	res.send(testLog.join("<br>"));
});
