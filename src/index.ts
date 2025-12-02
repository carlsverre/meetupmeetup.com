import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		// Handle POST /subscribe
		if (request.method === 'POST' && url.pathname === '/subscribe') {
			try {
				const formData = await request.formData();
				const email = formData.get('email')?.toString()?.trim();

				if (!email) {
					return new Response(JSON.stringify({ error: 'Email is required' }), {
						status: 400,
						headers: { 'Content-Type': 'application/json' },
					});
				}

				// Basic email validation
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(email)) {
					return new Response(JSON.stringify({ error: 'Invalid email format' }), {
						status: 400,
						headers: { 'Content-Type': 'application/json' },
					});
				}

				// Idempotent insert using INSERT OR IGNORE
				const result = await env.DB.prepare('INSERT OR IGNORE INTO subscribers (email) VALUES (?)').bind(email).run();

				// If a row was inserted (changes > 0), send notification email
				if (result.meta.changes > 0) {
					await reportSubscriber(env, email);
				}

				return new Response(JSON.stringify({ success: true }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				});
			} catch (error) {
				console.error('Error subscribing:', error);
				return new Response(JSON.stringify({ error: 'Internal server error' }), {
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				});
			}
		}

		// Fallback for other routes/methods
		return new Response('Not Found', { status: 404 });
	},
} satisfies ExportedHandler<Env>;

async function reportSubscriber(env: Env, email: String) {
	const msg = createMimeMessage();
	msg.setSender({ name: 'Meetup Meetup', addr: 'hello@meetupmeetup.com' });
	msg.setRecipient('hello@meetupmeetup.com');
	msg.setSubject('New meetupmeetup.com subscriber');
	msg.addMessage({
		contentType: 'text/plain',
		data: `New subscriber: ${email}`,
	});

	var message = new EmailMessage('hello@meetupmeetup.com', 'hello@meetupmeetup.com', msg.asRaw());
	await env.EMAIL.send(message);
}
