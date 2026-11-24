import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	duplicateForms,
	fieldSchema,
	formSchema,
	groupSchema,
	isNetlifyForm,
	netlifyForms,
	phonePattern,
} from './forms.ts';

const name = {
	name: 'name',
	label: 'Name',
	type: 'text',
	required: true,
	missing: 'Enter your name.',
};
const form = {
	title: 'Contact form',
	fields: [name],
	submit: 'Send',
	confirmation: 'Thank you. We will be in touch.',
};

const bad = (
	schema: { safeParse(d: unknown): { success: boolean } },
	d: unknown,
) => assert.equal(schema.safeParse(d).success, false);

describe('netlifyForms', () => {
	it('defines contact, volunteer and story', () => {
		assert.deepEqual(Object.keys(netlifyForms), [
			'contact',
			'volunteer',
			'story',
		]);
	});

	it('every form has an email field, for Reply-To', () => {
		for (const def of Object.values(netlifyForms)) {
			const names = def.fields.flatMap((f) =>
				'fields' in f ? f.fields.map((g) => g.name) : [f.name]
			);
			assert.ok(names.includes('email'), def.title);
		}
	});

	it('volunteer asks for a phone or an email (#30)', () => {
		const group = netlifyForms.volunteer.fields.find((f) => 'fields' in f);
		assert.ok(group && 'fields' in group);
		assert.deepEqual(group.fields.map((f) => f.name), ['phone', 'email']);
	});

	it('story shows the name only when ticked', () => {
		const field = netlifyForms.story.fields.find((f) =>
			'name' in f && f.type === 'checkbox'
		);
		assert.ok(field && 'name' in field);
		assert.equal(field.name, 'show-name');
	});

	it('knows which forms are Netlify forms', () => {
		assert.ok(isNetlifyForm('contact'));
		assert.ok(!isNetlifyForm('donate'));
		assert.ok(!isNetlifyForm('toString'));
	});
});

describe('fieldSchema', () => {
	it('requires a label', () => {
		const { label: _, ...unlabelled } = name;
		bad(fieldSchema, unlabelled);
		bad(fieldSchema, { ...name, label: '   ' });
	});

	it('requires a missing message on required fields', () => {
		const { missing: _, ...silent } = name;
		bad(fieldSchema, silent);
	});

	it('rejects names Netlify uses', () => {
		for (const reserved of ['bot-field', 'form-name', 'subject']) {
			bad(fieldSchema, { ...name, name: reserved });
		}
		bad(fieldSchema, { ...name, name: 'Full Name' });
	});

	it('rejects required checkboxes and unknown keys', () => {
		bad(fieldSchema, { ...name, type: 'checkbox' });
		bad(fieldSchema, { ...name, placeholder: 'Your name' });
	});
});

describe('groupSchema', () => {
	const phone = { name: 'phone', label: 'Phone', type: 'tel' };
	const email = { name: 'email', label: 'Email', type: 'email' };
	const group = {
		legend: 'How can we reach you?',
		hint: 'A phone number, an email, or both.',
		missing: 'Enter a phone number or an email address.',
		fields: [phone, email],
	};

	it('parses a phone-or-email group', () => {
		assert.ok(groupSchema.safeParse(group).success);
	});

	it('needs two optional fields and a missing message', () => {
		bad(groupSchema, { ...group, fields: [phone] });
		bad(groupSchema, { ...group, fields: [phone, { ...name, name: 'email' }] });
		const { missing: _, ...silent } = group;
		bad(groupSchema, silent);
	});
});

describe('formSchema', () => {
	it('parses a minimal form', () => {
		assert.ok(formSchema.safeParse(form).success);
	});

	it('rejects duplicate field names, even across groups', () => {
		bad(formSchema, { ...form, fields: [name, name] });
	});

	it('rejects vague button text', () => {
		bad(formSchema, { ...form, submit: 'Click here' });
	});
});

describe('duplicateForms', () => {
	it('allows each form once', () => {
		assert.deepEqual(
			duplicateForms([
				{ id: 'contact', forms: ['contact'] },
				{ id: 'donate', forms: ['donate'] },
				{ id: 'other', forms: ['donate'] },
			]),
			[],
		);
	});

	it('reports a form on two pages', () => {
		const errors = duplicateForms([
			{ id: 'contact', forms: ['contact'] },
			{ id: 'about', forms: ['contact'] },
		]);
		assert.equal(errors.length, 1);
		assert.match(errors[0]!, /contact, about/);
	});
});

describe('phonePattern', () => {
	// As the browser applies an HTML pattern: whole value, v flag
	const phone = new RegExp(`^(?:${phonePattern})$`, 'v');

	it('accepts common ways of writing a number', () => {
		for (
			const v of [
				'410-602-6075',
				'(410) 602 6075',
				'410.602.6075',
				'4106026075',
				'+1 410 602 6075',
				'+972 2 555 1234',
			]
		) assert.ok(phone.test(v), v);
	});

	it('rejects letters, short numbers and punctuation alone', () => {
		for (
			const v of [
				'abc',
				'410-602',
				'----------',
				'410-602-6075 x12',
				'1'.repeat(16),
			]
		) assert.ok(!phone.test(v), v);
	});
});
