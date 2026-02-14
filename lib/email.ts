import { Resend } from 'resend';

// NOTE: Ensure RESEND_API_KEY is in your .env
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'onboarding@resend.dev'; // Replace with your domain in production

export async function sendBookingRequestEmail(
  adminEmail: string,
  bookingDetails: {
    title: string;
    userName: string;
    userEmail: string;
    startTime: string;
    endTime: string;
    roomName: string;
  }
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY is missing. Email skipped.");
    return { success: false, error: "Missing API Key" };
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `New Booking Request: ${bookingDetails.title}`,
      html: `
        <h2>New Booking Request</h2>
        <p><strong>User:</strong> ${bookingDetails.userName} (${bookingDetails.userEmail})</p>
        <p><strong>Room:</strong> ${bookingDetails.roomName}</p>
        <p><strong>Title:</strong> ${bookingDetails.title}</p>
        <p><strong>Time:</strong> ${new Date(bookingDetails.startTime).toLocaleString()} - ${new Date(bookingDetails.endTime).toLocaleString()}</p>
        <br/>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin">Approve/Reject in Dashboard</a>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}

export async function sendBookingStatusEmail(
  userEmail: string,
  status: 'approved' | 'rejected',
  bookingDetails: {
    title: string;
    startTime: string;
    endTime: string;
    roomName: string;
  }
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY is missing. Email skipped.");
    return { success: false, error: "Missing API Key" };
  }

  const color = status === 'approved' ? 'green' : 'red';
  const statusText = status.charAt(0).toUpperCase() + status.slice(1);

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `Booking ${statusText}: ${bookingDetails.title}`,
      html: `
        <h2>Your booking has been <span style="color: ${color}">${status}</span></h2>
        <p><strong>Title:</strong> ${bookingDetails.title}</p>
        <p><strong>Room:</strong> ${bookingDetails.roomName}</p>
        <p><strong>Time:</strong> ${new Date(bookingDetails.startTime).toLocaleString()} - ${new Date(bookingDetails.endTime).toLocaleString()}</p>
        <br/>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings">View My Bookings</a>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}
