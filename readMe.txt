This is my first NodeJS program. Thank you to you who make me go this far.
This program contain 2 mode
> debug mode <default>: this mode will always return map [set by /debug_on]
> exam mode: return as expected in exam [set by /debug_off]
Require mysql, express

Please prepare mysal database with database name "taskworld" with table 
CREATE TABLE 'game_info' (
'game_id' varchar(50) NOT NULL,
'action_number' int(11) NOT NULL,
'action' varchar(30) NOT NULL,
'coordinate_x' int(11) NOT NULL,
'coordinate_y' int(11) NOT NULL,
'result' varchar(30) NOT NULL,
'ship_type' varchar(30) DEFAULT NULL,
'direction' varchar(30) DEFAULT NULL,
PRIMARY KEY ('game_id', 'action_number')

logic test </test/all>
 - test place ship out of map
 - test place over ship number
 - test place ship too near
 - test place ship in attack phrase
 - test attack in place ship phrase
 - test attack out of map
 - test attack same point
 - test kill ship
 - test game over
 - test place ship after game over
 - test attack after game over

Manual
/			: display map and action log
/reset		: reset the game
/set_attack	: open attack input form
/attack		: attack at X,Y [ex: /attack?coordinate_x=1&coordinate_y=1]
/set_ship	: open place ship input form
/ship		: place ship [ex: /ship?ship_type=Battleship&coordinate_x=1&coordinate_y=1&direction=vertical]
/debug_on	: set debug mode on
/debug_off	: set debug mode off
/test/all	: run logic test
/test/demo_place		: place 10 ships
/test/demo_attack		: attack all ship with 0 miss
/test/demo_attack_miss	: attack miss for 5 time
/test/demo_place_attack_miss_error	: run place attack miss and do some error

demo
place 10 ship <as /test/demo_place>
http://127.0.0.1:8081/ship?ship_type=Battleship&coordinate_x=1&coordinate_y=1&direction=vertical
http://127.0.0.1:8081/ship?ship_type=Cruisers&coordinate_x=3&coordinate_y=1&direction=vertical
http://127.0.0.1:8081/ship?ship_type=Cruisers&coordinate_x=4&coordinate_y=6&direction=horizontal
http://127.0.0.1:8081/ship?ship_type=Destroyers&coordinate_x=1&coordinate_y=6&direction=horizontal
http://127.0.0.1:8081/ship?ship_type=Destroyers&coordinate_x=7&coordinate_y=2&direction=horizontal
http://127.0.0.1:8081/ship?ship_type=Destroyers&coordinate_x=2&coordinate_y=8&direction=horizontal
http://127.0.0.1:8081/ship?ship_type=Submarines&coordinate_x=5&coordinate_y=8&direction=horizontal
http://127.0.0.1:8081/ship?ship_type=Submarines&coordinate_x=5&coordinate_y=10&direction=horizontal
http://127.0.0.1:8081/ship?ship_type=Submarines&coordinate_x=1&coordinate_y=10&direction=horizontal
http://127.0.0.1:8081/ship?ship_type=Submarines&coordinate_x=10&coordinate_y=10&direction=horizontal

attack miss <as /test/demo_attack_miss>
http://127.0.0.1:8081/attack?coordinate_x=1&coordinate_y=5
http://127.0.0.1:8081/attack?coordinate_x=7&coordinate_y=5
http://127.0.0.1:8081/attack?coordinate_x=9&coordinate_y=3
http://127.0.0.1:8081/attack?coordinate_x=10&coordinate_y=6
http://127.0.0.1:8081/attack?coordinate_x=7&coordinate_y=10

kill all ship <as /test/demo_attack>
http://127.0.0.1:8081/attack?coordinate_x=1&coordinate_y=1
http://127.0.0.1:8081/attack?coordinate_x=1&coordinate_y=2
http://127.0.0.1:8081/attack?coordinate_x=1&coordinate_y=3
http://127.0.0.1:8081/attack?coordinate_x=1&coordinate_y=4
http://127.0.0.1:8081/attack?coordinate_x=3&coordinate_y=1
http://127.0.0.1:8081/attack?coordinate_x=3&coordinate_y=2
http://127.0.0.1:8081/attack?coordinate_x=3&coordinate_y=3
http://127.0.0.1:8081/attack?coordinate_x=7&coordinate_y=2
http://127.0.0.1:8081/attack?coordinate_x=8&coordinate_y=2
http://127.0.0.1:8081/attack?coordinate_x=1&coordinate_y=6
http://127.0.0.1:8081/attack?coordinate_x=2&coordinate_y=6
http://127.0.0.1:8081/attack?coordinate_x=4&coordinate_y=6
http://127.0.0.1:8081/attack?coordinate_x=5&coordinate_y=6
http://127.0.0.1:8081/attack?coordinate_x=6&coordinate_y=6
http://127.0.0.1:8081/attack?coordinate_x=2&coordinate_y=8
http://127.0.0.1:8081/attack?coordinate_x=3&coordinate_y=8
http://127.0.0.1:8081/attack?coordinate_x=5&coordinate_y=8
http://127.0.0.1:8081/attack?coordinate_x=1&coordinate_y=10
http://127.0.0.1:8081/attack?coordinate_x=5&coordinate_y=10
http://127.0.0.1:8081/attack?coordinate_x=10&coordinate_y=10
