const EN = {
  title: 'Terms of Service',
  lastUpdated: 'Last updated:',
  sections: [
    {
      title: '1. Acceptance of Terms',
      body: 'By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.',
    },
    {
      title: '2. Use License',
      body: "Permission is granted to temporarily download one copy of the materials on Swisia's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:",
      items: [
        'modify or copy the materials',
        'use the materials for any commercial purpose or for any public display',
        'attempt to reverse engineer any software contained on the website',
        'remove any copyright or other proprietary notations from the materials',
      ],
    },
    {
      title: '3. Privacy Policy',
      body: 'Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the website, to understand our practices.',
    },
    {
      title: '4. User Accounts',
      body: 'When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.',
    },
    {
      title: '5. Prohibited Uses',
      body: 'You may not use our website:',
      items: [
        'For any unlawful purpose or to solicit others to perform unlawful acts',
        'To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances',
        'To infringe upon or violate our intellectual property rights or the intellectual property rights of others',
        'To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate',
        'To submit false or misleading information',
      ],
    },
    {
      title: '6. Content',
      body: 'Our website allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material. You are responsible for the content that you post to the website, including its legality, reliability, and appropriateness.',
    },
    {
      title: '7. Disclaimer',
      body: 'The information on this website is provided on an "as is" basis. To the fullest extent permitted by law, Swisia excludes all representations, warranties, conditions and terms relating to our website and the use of this website.',
    },
    {
      title: '8. Governing Law',
      body: 'These terms and conditions are governed by and construed in accordance with the laws of the United States and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.',
    },
    {
      title: '9. Changes to Terms',
      body: 'We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.',
    },
  ],
  contactTitle: '10. Contact Information',
  contactBefore: 'If you have any questions about these Terms of Service, please use our ',
  contactLink: 'Contact',
  contactAfter: ' page.',
} as const;

const FR = {
  title: 'Conditions de service',
  lastUpdated: 'Dernière mise à jour :',
  sections: [
    {
      title: '1. Acceptation des conditions',
      body: 'En accédant à ce site et en l’utilisant, vous acceptez d’être lié par les termes de cet accord. Si vous n’acceptez pas ces conditions, veuillez ne pas utiliser ce service.',
    },
    {
      title: '2. Licence d’utilisation',
      body: 'Il est autorisé de télécharger temporairement une copie des contenus du site Swisia pour une consultation personnelle, non commerciale et transitoire uniquement. Il s’agit d’une licence, non d’un transfert de propriété, et dans le cadre de cette licence vous ne pouvez pas :',
      items: [
        'modifier ou copier les contenus',
        'utiliser les contenus à des fins commerciales ou pour une diffusion publique',
        'tenter de rétroconcevoir tout logiciel présent sur le site',
        'supprimer toute mention de copyright ou autre indication propriétaire',
      ],
    },
    {
      title: '3. Politique de confidentialité',
      body: 'Votre vie privée est importante pour nous. Veuillez consulter notre Politique de confidentialité, qui régit également l’utilisation du site, afin de comprendre nos pratiques.',
    },
    {
      title: '4. Comptes utilisateurs',
      body: 'Lorsque vous créez un compte chez nous, vous devez fournir des informations exactes, complètes et à jour en tout temps. Vous êtes responsable de la protection de votre mot de passe et de toutes les activités effectuées sous votre compte.',
    },
    {
      title: '5. Utilisations interdites',
      body: 'Vous ne pouvez pas utiliser notre site :',
      items: [
        'À des fins illégales ou pour inciter d’autres à commettre des actes illégaux',
        'Pour violer toute réglementation, règle, loi ou ordonnance applicable',
        'Pour porter atteinte à nos droits de propriété intellectuelle ou à ceux d’autrui',
        'Pour harceler, abuser, insulter, nuire, diffamer, dénigrer, intimider ou discriminer',
        'Pour soumettre des informations fausses ou trompeuses',
      ],
    },
    {
      title: '6. Contenu',
      body: 'Notre site vous permet de publier, lier, stocker, partager ou rendre disponible certaines informations, textes, graphiques, vidéos ou autres contenus. Vous êtes responsable du contenu que vous publiez, y compris de sa légalité, fiabilité et pertinence.',
    },
    {
      title: '7. Avertissement',
      body: 'Les informations sur ce site sont fournies « en l’état ». Dans toute la mesure permise par la loi, Swisia exclut toutes déclarations, garanties, conditions et termes relatifs à notre site et à son utilisation.',
    },
    {
      title: '8. Droit applicable',
      body: 'Ces conditions sont régies et interprétées conformément aux lois des États-Unis, et vous vous soumettez irrévocablement à la juridiction exclusive des tribunaux de cet État ou de ce lieu.',
    },
    {
      title: '9. Modifications des conditions',
      body: 'Nous nous réservons le droit, à notre seule discrétion, de modifier ou de remplacer ces Conditions à tout moment. Si une révision est importante, nous tenterons de fournir un préavis d’au moins 30 jours avant l’entrée en vigueur des nouvelles conditions.',
    },
  ],
  contactTitle: '10. Coordonnées',
  contactBefore:
    'Pour toute question concernant ces Conditions de service, veuillez utiliser notre page ',
  contactLink: 'Contact',
  contactAfter: '.',
} as const;

export type TermsTranslations = typeof EN | typeof FR;

export function getTermsTranslations(isFrench: boolean): TermsTranslations {
  return isFrench ? FR : EN;
}
