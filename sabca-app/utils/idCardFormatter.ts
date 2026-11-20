export interface IdCardProfileInput {
    sabca_id?: string | null;
    membership_type?: string | null;
    phone?: string | null;
    blood_group?: string | null;
    company_name?: string | null;
    location?: string | null;
    email?: string | null;
}

export interface FormattedIdCardFields {
    idLine: string;
    contactLine: string | null;
    companyName: string | null;
    location: string | null;
    email: string | null;
}

/**
 * Escapes HTML special characters for safe interpolation into the exported ID card PDF template.
 */
export function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Formats Member ID card fields consistently for both on-screen rendering and PDF export,
 * omitting unset profile values instead of substituting placeholder or sample data.
 */
export function formatIdCardFields(
    profile: IdCardProfileInput | null | undefined,
    userEmail?: string | null
): FormattedIdCardFields {
    const sabcaId = profile?.sabca_id?.trim() || 'PENDING';
    const rawType = profile?.membership_type?.trim() || '';
    const lowerType = rawType.toLowerCase();

    let typeDisplay = '';
    if (lowerType === 'life' || lowerType === 'lifetime') {
        typeDisplay = 'LIFE TIME';
    } else if (lowerType && lowerType !== 'none') {
        typeDisplay = rawType.toUpperCase();
    }

    const idLine = typeDisplay ? `ID : ${sabcaId} : ${typeDisplay}` : `ID : ${sabcaId}`;

    const cleanPhone = profile?.phone ? profile.phone.replace(/^(\+91[- ]?)/, '').trim() : '';
    const cleanBloodGroup = profile?.blood_group?.trim() || '';

    const contactParts: string[] = [];
    if (cleanPhone) {
        contactParts.push(cleanPhone);
    }
    if (cleanBloodGroup) {
        contactParts.push(`Blood Group : ${cleanBloodGroup}`);
    }
    const contactLine = contactParts.length > 0 ? contactParts.join(' : ') : null;

    const companyName = profile?.company_name?.trim() || null;
    const location = profile?.location?.trim() || null;
    const email = (profile?.email || userEmail || '').trim() || null;

    return {
        idLine,
        contactLine,
        companyName,
        location,
        email,
    };
}
