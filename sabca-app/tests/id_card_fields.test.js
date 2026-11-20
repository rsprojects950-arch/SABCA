const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { formatIdCardFields, escapeHtml } = require('../utils/idCardFormatter.ts');

const ROOT_DIR = path.resolve(__dirname, '..');

test('Member ID Card Fields: No Hardcoded Sample Data & Clean Omission', async (t) => {
    await t.test('Omits unset company, location, blood group, and : NONE on a new account', () => {
        const result = formatIdCardFields(
            {
                sabca_id: null,
                membership_type: 'none',
                phone: '+918790862969',
                blood_group: '',
                company_name: null,
                location: '  ',
                email: null,
            },
            'sriramps31@gmail.com'
        );

        assert.strictEqual(result.idLine, 'ID : PENDING');
        assert.strictEqual(result.contactLine, '8790862969');
        assert.strictEqual(result.companyName, null);
        assert.strictEqual(result.location, null);
        assert.strictEqual(result.email, 'sriramps31@gmail.com');
    });

    await t.test('Formats blood-group-only without stray leading colon separator', () => {
        const result = formatIdCardFields({
            sabca_id: 'SABCA-001',
            membership_type: 'annual',
            phone: null,
            blood_group: 'B+',
        });

        assert.strictEqual(result.idLine, 'ID : SABCA-001 : ANNUAL');
        assert.strictEqual(result.contactLine, 'Blood Group : B+');
    });

    await t.test('Formats both phone and blood group together and handles lifetime variants', () => {
        const lifeRes = formatIdCardFields({
            sabca_id: 'SABCA-100',
            membership_type: 'life',
            phone: '+91 9876543210',
            blood_group: 'AB+',
            company_name: 'Sri Venkateswara Infra',
            location: 'Tirupati, AP',
            email: 'office@svinfra.in',
        });

        assert.strictEqual(lifeRes.idLine, 'ID : SABCA-100 : LIFE TIME');
        assert.strictEqual(lifeRes.contactLine, '9876543210 : Blood Group : AB+');
        assert.strictEqual(lifeRes.companyName, 'Sri Venkateswara Infra');
        assert.strictEqual(lifeRes.location, 'Tirupati, AP');
        assert.strictEqual(lifeRes.email, 'office@svinfra.in');

        const lifetimeRes = formatIdCardFields({
            sabca_id: 'SABCA-101',
            membership_type: 'Lifetime',
        });
        assert.strictEqual(lifetimeRes.idLine, 'ID : SABCA-101 : LIFE TIME');
        assert.strictEqual(lifetimeRes.contactLine, null);
        assert.strictEqual(lifetimeRes.email, null);
    });

    await t.test('escapeHtml safely escapes XML/HTML characters', () => {
        assert.strictEqual(
            escapeHtml('R & B <Infra> "Test" \'Co\''),
            'R &amp; B &lt;Infra&gt; &quot;Test&quot; &#39;Co&#39;'
        );
    });

    await t.test('Verifies app/(tabs)/index.tsx contains zero hardcoded sample card strings', () => {
        const indexPath = path.join(ROOT_DIR, 'app/(tabs)/index.tsx');
        const indexCode = fs.readFileSync(indexPath, 'utf8');

        assert.ok(!indexCode.includes('S R EDIFICE PVT LTD'), 'Hardcoded sample company name must be removed');
        assert.ok(!indexCode.includes('Autumn Field Apartment'), 'Hardcoded sample address must be removed');
        assert.ok(!indexCode.includes('srcvjw@gmail.com'), 'Hardcoded sample email must be removed');
        assert.ok(!indexCode.includes("blood_group || 'O+'"), "Hardcoded 'O+' blood group fallback must be removed");
    });
});
