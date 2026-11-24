import { z } from 'astro/zod';
import { linkText, text } from './shared.ts';

/**
 * The site's Netlify Forms (contact, volunteer, story): their fields, button
 * and default confirmation. Fields live in code, not content: Netlify
 * registers each form from the deployed HTML and drops fields it doesn't
 * know, so a field rename is a code change and a deploy.
 *
 * Validation is client-side only, plus Netlify's honeypot (issue #30).
 * The component is src/components/blocks/netlify-form.astro.
 */

/** Names Netlify or the component already use for their own inputs. */
const reserved = new Set(['form-name', 'bot-field', 'subject']);

const fieldName = z
	.string()
	.regex(/^[a-z][a-z0-9-]*$/, 'Lowercase letters, digits and hyphens.')
	.refine((name) => !reserved.has(name), 'Reserved by Netlify Forms.')
	.meta({
		description:
			'The name Netlify stores the answer under. Changing it starts a new column in the Netlify submissions list.',
	});

const missing = text(5, 80).meta({
	description:
		'Error shown when a required answer is empty. Say what to do, e.g. "Enter your name."',
});

export const fieldSchema = z
	.strictObject({
		name: fieldName,
		label: text(2, 60).meta({
			description:
				'Visible label for the field. Required: placeholders are not labels.',
		}),
		type: z.enum(['text', 'email', 'tel', 'textarea', 'checkbox']),
		required: z.boolean().default(false).meta({
			description:
				'Must be answered. Optional fields get "(optional)" after their label; checkboxes never do.',
		}),
		missing: missing.optional(),
		hint: text(5, 160).optional().meta({
			description: 'One short line under the label. Omit if the label says it.',
		}),
		autocomplete: z.enum(['name', 'email', 'tel']).optional().meta({
			description:
				"Lets browsers fill in the visitor's own details. Only for fields about the visitor.",
		}),
		autocapitalize: z.enum(['words']).optional().meta({
			description:
				"Phone keyboards start each word with a capital, for people's names. Omit for everything else: text fields already capitalize each sentence.",
		}),
	})
	.refine((f) => !f.required || f.missing, {
		message: 'A required field needs a "missing" message.',
		path: ['missing'],
	})
	.refine((f) => !(f.required && f.type === 'checkbox'), {
		message: "A checkbox can't be required.",
		path: ['required'],
	});

/**
 * Fields where at least one answer is needed, e.g. a phone number or an
 * email. Rendered as a fieldset whose legend asks the question.
 */
export const groupSchema = z
	.strictObject({
		legend: text(3, 60).meta({
			description:
				'The question the group answers, e.g. "How can we reach you?"',
		}),
		hint: text(5, 160).meta({
			description:
				'Says that one answer is enough, e.g. "A phone number, an email, or both."',
		}),
		missing,
		fields: z.array(fieldSchema).min(2).max(3),
	})
	.refine((g) => g.fields.every((f) => !f.required && f.type !== 'checkbox'), {
		message: 'Fields in a group are each optional text fields.',
		path: ['fields'],
	});

export const formSchema = z
	.strictObject({
		title: text(3, 40).meta({
			description:
				'What the form is, for the notification email\'s subject, e.g. "Contact form".',
		}),
		fields: z.array(z.union([fieldSchema, groupSchema])).min(1).max(8),
		submit: linkText(2, 30).meta({
			description: 'Button text, e.g. "Send".',
		}),
		confirmation: text(10, 250).meta({
			description: 'Shown after sending, unless the page block sets its own.',
		}),
	})
	.refine(
		(form) => {
			const names = form.fields.flatMap((f) =>
				'fields' in f ? f.fields.map((g) => g.name) : [f.name]
			);
			return new Set(names).size === names.length;
		},
		{ message: 'Field names must be unique.', path: ['fields'] },
	);

export type FormField = z.infer<typeof fieldSchema>;
export type FormGroup = z.infer<typeof groupSchema>;
export type FormDefinition = z.infer<typeof formSchema>;

/**
 * A phone number: 10 to 15 digits, optionally with a leading +, spaces,
 * dashes, dots or brackets, e.g. 410-602-6075, (410) 602 6075 or
 * +972 2 555 1234. An HTML `pattern` (whole value, `v` flag), so browsers
 * enforce it even without the form's script.
 */
export const phonePattern = String
	.raw`\+?[\s\(\)\.\-]*(?:\d[\s\(\)\.\-]*){10,15}`;

/** Errors for answers in the wrong format, by field type. */
export const formatErrors = {
	email: 'Enter an email address like name@example.com.',
	tel: 'Enter a phone number like 410-602-6075.',
} as const;

const phone = {
	name: 'phone',
	label: 'Phone',
	type: 'tel',
	autocomplete: 'tel',
} as const;

const define = (form: z.input<typeof formSchema>) => formSchema.parse(form);

const name = {
	name: 'name',
	label: 'Name',
	type: 'text',
	required: true,
	missing: 'Enter your name.',
	autocomplete: 'name',
	autocapitalize: 'words',
} as const;

const email = {
	name: 'email',
	label: 'Email',
	type: 'email',
	required: true,
	missing: 'Enter your email address.',
	autocomplete: 'email',
} as const;

/**
 * Wording from docs/claude/2-content.md. The `email` field also sets the
 * notification's Reply-To, so staff can answer from their inbox.
 */
export const netlifyForms = {
	contact: define({
		title: 'Contact form',
		fields: [
			name,
			email,
			{
				name: 'message',
				label: 'Message',
				type: 'textarea',
				required: true,
				missing: 'Enter your message.',
			},
		],
		submit: 'Send',
		confirmation:
			'Thank you. We’ve received your message and will be in touch. If this is urgent, please call us.',
	}),
	volunteer: define({
		title: 'Volunteer form',
		fields: [
			name,
			{
				legend: 'How can we reach you?',
				hint: 'A phone number, an email, or both.',
				missing: 'Enter a phone number or an email address.',
				fields: [
					phone,
					{ ...email, required: false, missing: undefined },
				],
			},
			{
				name: 'notes',
				label: 'Notes',
				type: 'textarea',
				hint: 'What you enjoy doing and when you’re free.',
			},
		],
		submit: 'Let’s talk',
		confirmation: 'We’ll be in touch in the next few days with next steps.',
	}),
	story: define({
		title: 'Story form',
		fields: [
			name,
			email,
			phone,
			{
				name: 'title',
				label: 'Story title',
				type: 'text',
				required: true,
				missing: 'Enter a title for your story.',
			},
			{
				name: 'story',
				label: 'Your story',
				type: 'textarea',
				required: true,
				missing: 'Enter your story.',
			},
			{
				// Unticked keeps the name private, so missing it is the safe way
				name: 'show-name',
				label: 'Show my name with the story',
				type: 'checkbox',
			},
		],
		submit: 'Send',
		confirmation:
			'Thank you. We’ve received your message and will be in touch.',
	}),
} satisfies Record<string, FormDefinition>;

export type NetlifyFormName = keyof typeof netlifyForms;

export const isNetlifyForm = (form: string): form is NetlifyFormName =>
	Object.hasOwn(netlifyForms, form);

/**
 * Netlify needs each form name once per site. Given each page's form block
 * names, returns an error per form used more than once, or none.
 */
export const duplicateForms = (
	pages: readonly { id: string; forms: readonly string[] }[],
): string[] => {
	const seen = new Map<string, string[]>();
	for (const page of pages) {
		for (const form of page.forms.filter(isNetlifyForm)) {
			seen.set(form, [...(seen.get(form) ?? []), page.id]);
		}
	}
	return [...seen]
		.filter(([, ids]) => ids.length > 1)
		.map(([form, ids]) =>
			`The "${form}" form is on more than one page (${
				ids.join(', ')
			}). Netlify needs each form once per site.`
		);
};
