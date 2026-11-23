import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { markdownProblems, renderMarkdown } from './markdown.ts';

describe('renderMarkdown', () => {
	it('renders everything the schema allows', () => {
		const html = renderMarkdown(
			'## Our Mission\n\n### Sub\n\nA **bold** and *italic* [link](/about).\n\n- one\n- two\n\n1. first\n',
		);
		assert.match(html, /<h2>Our Mission<\/h2>/);
		assert.match(html, /<h3>Sub<\/h3>/);
		assert.match(html, /<strong>bold<\/strong>/);
		assert.match(html, /<em>italic<\/em>/);
		assert.match(html, /<a href="\/about">link<\/a>/);
		assert.match(html, /<ul>/);
		assert.match(html, /<ol>/);
	});

	it('keeps the text as written', () => {
		const html = renderMarkdown(
			'Gevuras Yarden, the “Strength of Jordan,” -- ok',
		);
		assert.match(html, /the “Strength of Jordan,” -- ok/);
	});

	it('shifts heading levels with headingOffset', () => {
		const html = renderMarkdown('## Two\n\n### Three', {
			headingOffset: 1,
		}).replace(/\n/g, '');
		assert.match(html, /<h3>Two<\/h3><h4>Three<\/h4>/);
	});

	it('throws on anything else', () => {
		assert.throws(() => renderMarkdown('<b>hi</b>'), /Not allowed: HTML/);
	});
});

describe('markdownProblems', () => {
	const cases: [string, RegExp][] = [
		['# Title', /## or ###/],
		['#### Deep', /## or ###/],
		['![a photo](a.png)', /images/],
		['Text <span>raw</span>', /HTML/],
		['| a |\n|---|\n| b |', /^$/], // no tables: stays a plain paragraph
		['> quote', /block quotes/],
		['`code`', /inline code/],
		['a\n\n---\n\nb', /horizontal rules/],
		['[x](javascript:alert(1))', /Link "javascript:alert\(1\)"/],
		['[x](http://example.com)', /Link "http:\/\/example.com"/],
	];

	for (const [source, expected] of cases) {
		it(`checks ${JSON.stringify(source)}`, () => {
			assert.match(markdownProblems(source).join(' '), expected);
		});
	}

	it('rejects headings when they are off', () => {
		assert.deepEqual(markdownProblems('## Hi', { headings: false }), [
			'Headings are not allowed here.',
		]);
	});

	it('allows https, tel and mailto links', () => {
		assert.deepEqual(
			markdownProblems(
				'[a](https://example.org) [b](tel:+14106026075) [c](mailto:info@example.org)',
			),
			[],
		);
	});
});
