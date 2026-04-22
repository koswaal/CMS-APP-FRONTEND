import React from 'react';

// Componentes de iconos SVG para React

const ChartLineIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M3 13.5a.75.75 0 0 1 .75-.75h5.25V3.75a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 .75.75v9H21a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-.75.75H3a.75.75 0 0 1-.75-.75v-6Z" clipRule="evenodd"/>
    <path d="M6.75 9.75h.75v.75h-.75v-.75ZM6.75 12h.75v.75h-.75V12Zm.75 2.25h-.75v.75h.75v-.75Z"/>
    <path fillRule="evenodd" d="M15.75 9.75h-.75v.75h.75v-.75Zm-1.5 0h.75v.75h-.75v-.75Z" clipRule="evenodd"/>
    <path d="M15 12h-.75v.75H15V12Zm1.5 0h-.75v.75h.75V12Zm-1.5 2.25h-.75v.75H15v-.75Z"/>
  </svg>
);

const UsersIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM15.75 6.75a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clipRule="evenodd"/>
    <path d="M12 12.75c-3.314 0-6 2.686-6 6v.75h12v-.75c0-3.314-2.686-6-6-6Z"/>
    <path fillRule="evenodd" d="M18 9.75a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" clipRule="evenodd"/>
    <path d="M18.75 14.25c-1.5 0-2.833.667-3.75 1.667V18h6v-.75c0-1.5-1-2.75-2.25-3Z"/>
  </svg>
);

const BuildingIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm3-1.5A1.5 1.5 0 0 0 4.5 6v12A1.5 1.5 0 0 0 6 19.5h12a1.5 1.5 0 0 0 1.5-1.5V6A1.5 1.5 0 0 0 18 4.5H6Z" clipRule="evenodd"/>
    <path d="M6.75 7.5h.75v.75h-.75V7.5Zm2.25 0h.75v.75H9V7.5Zm2.25 0h.75v.75h-.75V7.5Zm-4.5 2.25h.75v.75h-.75v-.75Zm2.25 0h.75v.75H9v-.75Zm2.25 0h.75v.75h-.75V7.5Zm-4.5 2.25h.75v.75H9v-.75Zm2.25 0h.75v.75h-.75V9Zm2.25 0h.75v.75h-.75V9Zm5.25-4.5h.75v.75h-.75V7.5Zm2.25 0h.75v.75h-.75V7.5Zm-2.25 2.25h.75v.75h-.75v-.75Zm2.25 0h.75v.75h-.75v-.75Zm-2.25 2.25h.75v.75h-.75V12Zm2.25 0h.75v.75h-.75V12Z"/>
    <path d="M6.75 13.5v3h10.5v-3H6.75Z"/>
  </svg>
);

const CogIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.25 1.286l-.622 2.183a1.875 1.875 0 0 0 .991 2.333l.555.242c.106.046.22.135.286.293a7.492 7.492 0 0 0 .34.882c.066.185.03.376-.07.524l-.418.623a1.875 1.875 0 0 0 0 2.238l.418.623c.1.148.136.34.07.524-.1.304-.239.6-.34.882-.066.158-.18.247-.286.293l-.555.242a1.875 1.875 0 0 0-.991 2.333l.622 2.183a1.875 1.875 0 0 0 2.25 1.286l2.063-.462c.116-.043.284-.032.45.083.29.202.629.412.986.57.182.088.277.228.297.348l.228 1.072c.151.904.933 1.567 1.85 1.567h1.756c.917 0 1.699-.663 1.85-1.567l.228-1.072c.02-.12.115-.26.297-.348a7.493 7.493 0 0 0 .986-.57c.166-.115.334-.126.45-.083l2.063.462a1.875 1.875 0 0 0 2.25-1.286l.622-2.183a1.875 1.875 0 0 0-.991-2.333l-.555-.242c-.106-.046-.22-.135-.286-.293a7.492 7.492 0 0 0-.34-.882c-.066-.185-.03-.376.07-.524l.418-.623a1.875 1.875 0 0 0 0-2.238l-.418-.623c-.1-.148-.136-.34-.07-.524.1-.304.239-.6.34-.882.066-.158.18-.247.286-.293l.555-.242a1.875 1.875 0 0 0 .991-2.333l-.622-2.183a1.875 1.875 0 0 0-2.25-1.286l-2.063.462c-.116.043-.284.032-.45-.083a7.493 7.493 0 0 0-.986-.57c-.182-.088-.277-.228-.297-.348l-.228-1.072A1.875 1.875 0 0 0 12.922 2.25h-1.844ZM12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z" clipRule="evenodd"/>
  </svg>
);

const HomeIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.06l-8.69-8.69a2.25 2.25 0 0 0-3.18 0l-8.69 8.69a.75.75 0 1 0 1.06 1.06l8.69-8.69Z"/>
    <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.43Z"/>
  </svg>
);

const LocationIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.407-4.185 3.604-6.782.052-.617-.053-1.231-.314-1.823-.518-1.165-1.372-2.148-2.464-2.826a7.035 7.035 0 0 0-3.498-1.02 6.908 6.908 0 0 0-3.498 1.02c-1.092.678-1.946 1.661-2.464 2.826-.261.592-.366 1.206-.314 1.823.197 2.597 1.66 4.792 3.604 6.782a19.58 19.58 0 0 0 2.683 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd"/>
  </svg>
);

const ListIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M3 6a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3V6ZM3 15.75a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2.25Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3v-2.25Z" clipRule="evenodd"/>
  </svg>
);

const DatabaseIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    <path d="M21 5c0 1.66-4 3-9 3s-9-1.34-9-3s4-3 9-3s9 1.34 9 3z"/>
  </svg>
);

const WrenchIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M12 6.75a5.25 5.25 0 0 1 6.188-4.994c-1.174.586-2.016 1.506-2.456 2.759-.443 1.263-.414 2.756.065 4.166.478 1.406 1.306 2.458 2.456 3.012 1.174.563 2.518.635 3.752.186v.012a5.25 5.25 0 0 1-2.456 4.044 5.25 5.25 0 0 1-4.005.911 5.228 5.228 0 0 1-2.166-1.094l-.011-.01v3.047a.75.75 0 0 1-1.5 0v-3.047l-.011.01a5.227 5.227 0 0 1-2.166 1.094 5.25 5.25 0 0 1-4.005-.911 5.25 5.25 0 0 1-2.456-4.044c1.234.449 2.578.377 3.752-.186 1.15-.554 1.978-1.606 2.456-3.012.479-1.41.508-2.903.065-4.166-.44-1.253-1.282-2.173-2.456-2.759A5.25 5.25 0 0 1 12 6.75Z" clipRule="evenodd"/>
  </svg>
);

const UserIcon = ({ className = "w-10 h-10" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd"/>
  </svg>
);

const DollarSignIcon = ({ className = "w-10 h-10" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M10.464 8.746c.227-1.106.693-1.826 1.406-2.226.648-.366 1.452-.467 2.35-.266.683.153 1.3.474 1.77.876.195.167.373.35.534.544.44.53.746 1.169.89 1.872.086.416.12.837.101 1.253a.75.75 0 0 0 1.5 0c0-.2 0-.4-.03-.6a7.413 7.413 0 0 0-.533-2.17 6.154 6.154 0 0 0-1.51-2.26c-.736-.716-1.644-1.14-2.63-1.285-.986-.146-1.99.008-2.91.455-.87.424-1.558 1.11-1.96 1.964-.326.711-.48 1.508-.44 2.306a.75.75 0 0 0 1.5-.04Z"/>
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v.75H9a.75.75 0 0 0 0 1.5h.75V15a.75.75 0 0 0 1.5 0v-.75h.75a.75.75 0 0 0 0-1.5h-.75V9Z" clipRule="evenodd"/>
  </svg>
);

const BoxIcon = ({ className = "w-10 h-10" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75c0-1.036-.84-1.875-1.875-1.875H3.375Z"/>
    <path fillRule="evenodd" d="M3.087 9l.54 9.176A3 3 0 0 0 6.62 21h10.757a3 3 0 0 0 2.995-2.824L20.913 9H3.087Z" clipRule="evenodd"/>
    <path d="M12 9.75a.75.75 0 0 1 .75.75v6.938l.527-.527a.75.75 0 1 1 1.06 1.06l-1.5 1.5a.75.75 0 0 1-1.06 0l-1.5-1.5a.75.75 0 0 1 1.06-1.06l.527.527v-6.938a.75.75 0 0 1 .75-.75Z"/>
  </svg>
);

const ChartLineUpIcon = ({ className = "w-10 h-10" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M15.22 6.268a.75.75 0 0 1 .968-.432l5.942 2.28a.75.75 0 0 1 .431.97l-2.28 5.941a.75.75 0 1 1-1.4-.537l1.63-4.251-1.087.483a11.2 11.2 0 0 0-5.934 5.938l-.348 1.841a1.323 1.323 0 0 1-1.478 1.076l-.263-.052a.75.75 0 0 1-.291-1.404l.263.052a.25.25 0 0 0 .283-.196l.347-1.84a12.7 12.7 0 0 1 6.728-6.729l1.842-.348a.25.25 0 0 0 .196-.283l-.052-.263a.75.75 0 0 1 1.404.291Z" clipRule="evenodd"/>
  </svg>
);

const BarChartIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M2.25 13.5a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-.75.75H3a.75.75 0 0 1-.75-.75v-6Zm7.5-4.5a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75H10.5a.75.75 0 0 1-.75-.75V9ZM18 6a.75.75 0 0 0-.75.75v13.5a.75.75 0 0 0 .75.75h4.5a.75.75 0 0 0 .75-.75V6.75a.75.75 0 0 0-.75-.75H18Z" clipRule="evenodd"/>
  </svg>
);

const EditIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-.711 2.487l-.13 2.848a.75.75 0 0 0 .856.857l2.849-.13a5.25 5.25 0 0 0 2.487-.711l12.15-12.15Z"/>
  </svg>
);

const TrashIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.663 52.663 0 0 1 2.368 0c1.603.051 2.816 1.387 2.816 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0c.62.02 1.136.497 1.136 1.117v.13a49.731 49.731 0 0 0-5.571 0v-.13c0-.62.516-1.097 1.136-1.117Z" clipRule="evenodd"/>
    <path d="M7.5 6.75v13.5a.75.75 0 0 0 1.5 0v-13.5a.75.75 0 0 0-1.5 0Zm4.5 0v13.5a.75.75 0 0 0 1.5 0v-13.5a.75.75 0 0 0-1.5 0Zm4.5 0v13.5a.75.75 0 0 0 1.5 0v-13.5a.75.75 0 0 0-1.5 0Z"/>
  </svg>
);

const PlusIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd"/>
  </svg>
);

const CheckIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd"/>
  </svg>
);

const MoonIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z" clipRule="evenodd"/>
  </svg>
);

const SunIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0Zm11.19-2.47a.75.75 0 0 1 1.06 0l1.591 1.59a.75.75 0 1 1-1.06 1.061l-1.591-1.59a.75.75 0 0 1 0-1.061ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75Zm-3.183 6.182a.75.75 0 0 1 1.06 0l1.591 1.591a.75.75 0 1 1-1.061 1.06l-1.59-1.591a.75.75 0 0 1 0-1.061ZM12 18.75a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25a.75.75 0 0 1 .75-.75Zm-6.182-3.183a.75.75 0 0 1 0 1.061l-1.59 1.591a.75.75 0 0 1-1.061-1.06l1.59-1.591a.75.75 0 0 1 1.061 0ZM12 8.25a3.75 3.75 0 1 0 7.5 3.75 3.75 0 0 0 0-7.5Z"/>
  </svg>
);

const LogoutIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 0 0 6 5.25v13.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5V15a.75.75 0 0 1 1.5 0v3.75a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V5.25a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3V9a.75.75 0 0 1-1.5 0V5.25a1.5 1.5 0 0 0-1.5-1.5h-6Z" clipRule="evenodd"/>
    <path d="M21 12a.75.75 0 0 1-.75.75h-9.69l1.72 1.72a.75.75 0 1 1-1.06 1.06l-3-3a.75.75 0 0 1 0-1.06l3-3a.75.75 0 1 1 1.06 1.06l-1.72 1.72h9.69A.75.75 0 0 1 21 12Z"/>
  </svg>
);

const BellIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Zm4.502 8.9a2.25 2.25 0 1 0 3.496 0 24.87 24.87 0 0 0-3.496 0Z" clipRule="evenodd"/>
  </svg>
);

const MenuIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75ZM3 12a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12Zm0 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd"/>
  </svg>
);

const ChevronRightIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l6.5 6.5a.75.75 0 0 1 0 1.06l-6.5 6.5a.75.75 0 0 1-1.06-1.06L13.94 12 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd"/>
  </svg>
);

// Objeto de iconos para compatibilidad con código existente
export const icons = {
  chartLine: ChartLineIcon,
  users: UsersIcon,
  building: BuildingIcon,
  cog: CogIcon,
  home: HomeIcon,
  location: LocationIcon,
  list: ListIcon,
  database: DatabaseIcon,
  wrench: WrenchIcon,
  user: UserIcon,
  dollarSign: DollarSignIcon,
  box: BoxIcon,
  chartLineUp: ChartLineUpIcon,
  barChart: BarChartIcon,
  edit: EditIcon,
  trash: TrashIcon,
  plus: PlusIcon,
  check: CheckIcon,
  moon: MoonIcon,
  sun: SunIcon,
  logout: LogoutIcon,
  bell: BellIcon,
  menu: MenuIcon,
  chevronRight: ChevronRightIcon,
};

export { ChartLineIcon, UsersIcon, BuildingIcon, CogIcon, HomeIcon, LocationIcon, ListIcon, DatabaseIcon, WrenchIcon, UserIcon, DollarSignIcon, BoxIcon, ChartLineUpIcon, BarChartIcon, EditIcon, TrashIcon, PlusIcon, CheckIcon, MoonIcon, SunIcon, LogoutIcon, BellIcon, MenuIcon, ChevronRightIcon };

export default icons;
