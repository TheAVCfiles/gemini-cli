import stageportCrestSvg from '../assets/crestSvg.js';

const operatorLiteracyCredential = {
  credential: {
    name: 'Operator Literacy v1',
    issuer: 'StagePort OS',
    recipient: 'Allison Van Cura',
    status: 'ACTIVE',
    hash: '0xLEARNEDINREALTIME',
    epoch: '01',
    definition:
      'Ability to read, interpret, and relate to multi-layer system signals across Ledger, Callboard, Whisper, and Manifest interfaces without external translation.',
    proof_signals: {
      contextual_awareness: 'Callboard → Contracts → Studio Load → Live Chain',
      ledger_comprehension: 'Roles, grants, hashes, kinetic signatures',
      system_reasoning: 'Tech debt / narrative debt / resource debt',
      aesthetic_alignment: 'Dashboard → UI → ledger styling',
      pattern_recognition: 'Analytics → choreography → proof',
    },
    visual_archetype: {
      crest_colors: {
        courtBlue: '#003F7D',
        sentientSilver: '#C9CCD1',
        rosewaterGold: '#D9AF6A',
        glitchViolet: '#6A4CFF',
        motherboardGreen: '#00A86B',
      },
      crest_geometry: 'Torus ring with inner Y glyph; notarized halo animation',
      visual_asset: {
        svg: stageportCrestSvg,
        notes:
          'Set class to state--inactive | state--active | state--notarized to control state. Inline SVG required for animation.',
      },
    },
    invocation_rule: {
      trigger_phrase: 'I Am Learning',
      system_response: 'Mint Operator Literacy v1 badge',
    },
  },
};

export default operatorLiteracyCredential;
