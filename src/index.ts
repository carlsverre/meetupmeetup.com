import { Resend } from 'resend';

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

				// Add contact to Resend
				const resend = new Resend(env.RESEND_API_KEY);
				let resp = await resend.contacts.create({ email });

				// check resp.error
				if (resp.error) {
					console.error('Resend API error:', resp.error);
					return new Response(JSON.stringify({ error: 'Failed to subscribe' }), {
						status: 500,
						headers: { 'Content-Type': 'application/json' },
					});
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
