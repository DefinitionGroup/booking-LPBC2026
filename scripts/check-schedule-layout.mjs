import assert from "node:assert/strict";

import { layoutTimelineBookings } from "../components/schedule/timeline-layout.ts";

function booking(id, start, end) {
  return {
    id,
    title: "Reserved",
    start_time: `2026-08-14T${start}:00Z`,
    end_time: `2026-08-14T${end}:00Z`,
    room: { name: `Room ${id}` },
    status: "approved",
  };
}

function byId(positionedBookings) {
  return new Map(positionedBookings.map((item) => [item.booking.id, item]));
}

const overlappingPair = byId(
  layoutTimelineBookings([
    booking("alpha", "09:00", "10:30"),
    booking("bravo", "09:30", "11:00"),
  ])
);

assert.equal(overlappingPair.get("alpha").columnCount, 2);
assert.equal(overlappingPair.get("bravo").columnCount, 2);
assert.notEqual(overlappingPair.get("alpha").column, overlappingPair.get("bravo").column);

const chainedOverlap = byId(
  layoutTimelineBookings([
    booking("alpha", "09:00", "10:00"),
    booking("bravo", "09:30", "10:30"),
    booking("charlie", "10:00", "11:00"),
  ])
);

assert.equal(chainedOverlap.get("alpha").columnCount, 2);
assert.equal(chainedOverlap.get("bravo").columnCount, 2);
assert.equal(chainedOverlap.get("charlie").columnCount, 2);
assert.equal(chainedOverlap.get("alpha").column, chainedOverlap.get("charlie").column);

const tripleOverlap = layoutTimelineBookings([
  booking("alpha", "09:00", "10:00"),
  booking("bravo", "09:00", "10:00"),
  booking("charlie", "09:00", "10:00"),
]);

assert.deepEqual(new Set(tripleOverlap.map((item) => item.column)), new Set([0, 1, 2]));
assert.ok(tripleOverlap.every((item) => item.columnCount === 3));

const touchingPair = layoutTimelineBookings([
  booking("alpha", "09:00", "10:00"),
  booking("bravo", "10:00", "11:00"),
]);

assert.ok(touchingPair.every((item) => item.column === 0 && item.columnCount === 1));

console.log("PASS schedule layout separates overlapping bookings into columns");
