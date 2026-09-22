import { FeedbackEntry, Plant } from '../types/database';

export const sendFeedbackEmailNotification = async (
  feedback: Omit<FeedbackEntry, 'id' | 'created_at'>,
  globalRecipientEmail?: string,
  plantObj?: Plant
): Promise<boolean> => {
  // Route to Plant-Specific HR / Contractor Email if configured, otherwise fallback to global notification email (Request #1)
  const targetEmail = plantObj?.notification_email || globalRecipientEmail || 'software.2040@pgel.in';

  console.log(`[Email Dispatch] Routing alert email for plant "${feedback.plant_name || feedback.plant_id}" to:`, targetEmail);

  // Email Notification Payload
  const emailPayload = {
    to: targetEmail,
    plant_notification_email: plantObj?.notification_email || 'Not configured (using global default)',
    subject: `[PG Canteen Alert - ${feedback.plant_location || 'Plant'}] New ${feedback.meal_type} Feedback Received (${feedback.overall_rating} ★)`,
    employee: feedback.employee_name || 'Anonymous Employee',
    employee_id: feedback.employee_id || 'N/A',
    phone: feedback.phone || 'N/A',
    email: feedback.email || 'N/A',
    plant: feedback.plant_display_name || feedback.plant_name || feedback.plant_id,
    plant_location: feedback.plant_location || 'N/A',
    meal_type: feedback.meal_type,
    shift: feedback.shift,
    food_taste: `${feedback.food_taste} / 5`,
    food_quality: `${feedback.food_quality} / 5`,
    staff_behaviour: `${feedback.staff_behaviour} / 5`,
    hygiene: `${feedback.hygiene} / 5`,
    overall_rating: `${feedback.overall_rating} / 5.0`,
    remark: feedback.remark || 'No written remark provided.',
    submitted_at: new Date().toLocaleString(),
  };

  try {
    const webhookUrl = import.meta.env.VITE_EMAIL_WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload),
      });
    }

    return true;
  } catch (err) {
    console.warn('Email notification dispatch error', err);
    return false;
  }
};
