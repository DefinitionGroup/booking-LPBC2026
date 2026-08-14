export interface TimelineBooking {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  room?: { name: string };
  status: string;
}

export interface PositionedTimelineBooking {
  booking: TimelineBooking;
  column: number;
  columnCount: number;
}

export function layoutTimelineBookings(
  bookings: TimelineBooking[]
): PositionedTimelineBooking[] {
  const sortedBookings = bookings
    .map((booking) => ({
      booking,
      start: new Date(booking.start_time).getTime(),
      end: new Date(booking.end_time).getTime(),
    }))
    .sort(
      (a, b) =>
        a.start - b.start ||
        b.end - a.end ||
        a.booking.id.localeCompare(b.booking.id)
    );

  const positionedBookings: PositionedTimelineBooking[] = [];
  let cluster: typeof sortedBookings = [];
  let clusterEnd = Number.NEGATIVE_INFINITY;

  const positionCluster = () => {
    if (cluster.length === 0) {
      return;
    }

    const columnEnds: number[] = [];
    const clusterPositions = cluster.map(({ booking, start, end }) => {
      let column = columnEnds.findIndex((columnEnd) => columnEnd <= start);

      if (column === -1) {
        column = columnEnds.length;
      }

      columnEnds[column] = end;

      return { booking, column };
    });
    const columnCount = columnEnds.length;

    positionedBookings.push(
      ...clusterPositions.map(({ booking, column }) => ({
        booking,
        column,
        columnCount,
      }))
    );
  };

  for (const timedBooking of sortedBookings) {
    if (cluster.length > 0 && timedBooking.start >= clusterEnd) {
      positionCluster();
      cluster = [];
      clusterEnd = Number.NEGATIVE_INFINITY;
    }

    cluster.push(timedBooking);
    clusterEnd = Math.max(clusterEnd, timedBooking.end);
  }

  positionCluster();

  return positionedBookings;
}
