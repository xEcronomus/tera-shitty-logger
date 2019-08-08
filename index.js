const fs = require('fs');
const path = require('path');
const Command = require('command');

const DUNGEON_ZONE_IDS = [9782, 9982];
const BOSS_HUNTINGZONE_IDS = [782, 982];
const BOSS_TEMPLATE_IDS = [1000, 2000, 3000];
const BOSS_NAMES = ['Nedra', 'Ptakum', 'Kylos'];

module.exports = function GLLogger(dispatch) {

	const cmd = new Command(dispatch);

	let enabled = false;
	let bossGameId = null;
	let currentZone = null;
	let events = [];
	let logfile;

	dispatch.hook('S_ACTION_STAGE', 5, event => {
		if(!enabled) return; 
		if(!BOSS_TEMPLATE_IDS.includes(event.templateId)) return;
		
		events.push(event);
	});

	dispatch.hook('S_DUNGEON_EVENT_MESSAGE', 1, event => {
		if(!enabled) return;
		
		events.push(event);
	});

	dispatch.hook('S_SPAWN_NPC', 8, event => {
		if(!enabled) return;
		if(!BOSS_HUNTINGZONE_IDS.includes(event.huntingZoneId)) return;
		
		for(let i in BOSS_TEMPLATE_IDS) {
			if(BOSS_TEMPLATE_IDS[i] == event.templateId) {
				logfile = path.join(__dirname, '/', (currentZone == DUNGEON_ZONE_IDS[1] ? 'Nightmare ' : '') + BOSS_NAMES[i] + '.' + (new Date().getTime()).toString() + '.log');
				bossGameId = event.gameId;
				break;
			}
		}
	});

	dispatch.hook('S_DESPAWN_NPC', 3, event => {
		if(!enabled && bossGameId != event.gameId) return;
		fs.writeFileSync(logfile, JSON.stringify(events, null, 4), 'utf8');
		bossGameId = null;
	});

	dispatch.hook('S_LOAD_TOPO', 3, event => {
		currentZone = event.zone;
		if(!DUNGEON_ZONE_IDS.includes(event.zone)) {
			enabled = false;
			return;
		}
		
		enabled = true;
		if(event.zone == DUNGEON_ZONE_IDS[0])
			cmd.message('Welcome to Grotto of Lost Souls (Normal Mode). All Boss Actions and data will be logged.');
		else if(event.zone == DUNGEON_ZONE_IDS[1])
			cmd.message('Welcome to Grotto of Lost Souls (Hard Mode). All Boss Actions and data will be logged.');
	});
}