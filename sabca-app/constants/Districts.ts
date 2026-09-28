export type District = {
    name: string;
    code: string;
};

export const DISTRICTS: District[] = [
    { name: 'Tirupati (SABCA-TPT)', code: 'TPT' },
    { name: 'Ananthapuramu (SABCA-CWA-ATP)', code: 'CWA-ATP' },
    { name: 'Kurnool (SABCA-KNL)', code: 'KNL' },
    { name: 'Nellore (SABCA-NLR)', code: 'NLR' },
    { name: 'Guntur Prakasam (SABCA-SGP)', code: 'SGP' },
    { name: 'Krishna (SABCA-KRN)', code: 'KRN' },
    { name: 'Guntur Nagarapalaka Samata (SABCA-GMCA)', code: 'GMCA' },
    { name: 'Eluru West Godavari (SABCA-ELWG)', code: 'ELWG' },
    { name: 'East Godavari (SABCA-EGD)', code: 'EGD' },
    { name: 'Kakinada & Konaseema (SABCA-KKCA)', code: 'KKCA' },
    { name: 'Visakha (SABCA-VSP)', code: 'VSP' },
    { name: 'Greater Visakha (SABCA-GVMC-CWA)', code: 'GVMC-CWA' },
    { name: 'Vizianagaram (SABCA-RCA-VZMD)', code: 'RCA-VZMD' },
    { name: 'Srikakulam (SABCA-SKLM)', code: 'SKLM' },
    { name: 'Vizianagaram Municipal (SABCA-VZM-CWA)', code: 'VZM-CWA' },
    { name: 'Mangalagiri Tadepalli (SABCA-MTMC)', code: 'MTMC' },
];

export const MEMBERSHIP_TYPES = [
    { label: 'Annual Membership (AM)', value: 'Annual', code: 'AM', color: '#10B981' },
    { label: 'Life Membership (LM)', value: 'Life', code: 'LM', color: '#F59E0B' },
    { label: 'Global Membership (GM)', value: 'Global', code: 'GM', color: '#6366F1' },
];
