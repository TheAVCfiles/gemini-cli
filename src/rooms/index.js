import room001 from "./room001.js";
import room002 from "./room002.js";
import room003 from "./room003.js";
import room004 from "./room004.js";
import room005 from "./room005.js";
import room006 from "./room006.js";
import room007 from "./room007.js";
import room008 from "./room008.js";

export const rooms = {
  "001": room001,
  "002": room002,
  "003": room003,
  "004": room004,
  "005": room005,
  "006": room006,
  "007": room007,
  "008": room008
};

export function loadRoom(id) {
  const loader = rooms[id];
  return loader ? loader() : null;
}
