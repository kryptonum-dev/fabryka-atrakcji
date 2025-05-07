import type { BaseHotelProps, BaseActivityProps, AddonItem, Alert } from '@/src/global/types'
import type { ImageDataProps } from '@/src/components/ui/image'
import { dispatchAddonsPopup } from './events'
import { optimizeImage } from './optimize-images'
import { toHTMLClient } from './to-html-client'

// Function to create stars based on rating
function createStarRating(count: number): string {
  let starsHTML = ''
  for (let i = 0; i < 5; i++) {
    if (i < count) {
      starsHTML += `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
  <mask id="path-1-inside-1_7977_14533" fill="white">
    <path d="M6.73674 1.11376C6.84373 0.896977 7.15285 0.896977 7.25983 1.11376L8.81623 4.26737C8.85872 4.35345 8.94084 4.41312 9.03584 4.42692L12.5161 4.93263C12.7553 4.96739 12.8508 5.26138 12.6777 5.43012L10.1594 7.88487C10.0907 7.95187 10.0593 8.04842 10.0755 8.14303L10.67 11.6092C10.7109 11.8475 10.4608 12.0291 10.2468 11.9167L7.13401 10.2802C7.04904 10.2355 6.94753 10.2355 6.86256 10.2802L3.74976 11.9167C3.53579 12.0291 3.2857 11.8475 3.32657 11.6092L3.92106 8.14303C3.93729 8.04842 3.90592 7.95187 3.83718 7.88487L1.31887 5.43012C1.14576 5.26138 1.24128 4.96739 1.48051 4.93263L4.96073 4.42692C5.05573 4.41312 5.13785 4.35345 5.18034 4.26737L6.73674 1.11376Z"/>
  </mask>
  <g clip-path="url(#paint0_angular_7977_14533_clip_path)" data-figma-skip-parse="true"><g transform="matrix(0.00419478 0.00399985 -0.00419476 0.00399987 6.99829 6.45099)"><foreignObject x="-3208.38" y="-3208.38" width="6416.76" height="6416.76"><div xmlns="http://www.w3.org/1999/xhtml" style="background:conic-gradient(from 90deg,rgba(121, 141, 220, 1) 0deg,rgba(231, 199, 143, 1) 90deg,rgba(250, 116, 104, 1) 266.4deg,rgba(121, 141, 220, 1) 360deg);height:100%;width:100%;opacity:1"></div></foreignObject></g></g><path d="M6.73674 1.11376C6.84373 0.896977 7.15285 0.896977 7.25983 1.11376L8.81623 4.26737C8.85872 4.35345 8.94084 4.41312 9.03584 4.42692L12.5161 4.93263C12.7553 4.96739 12.8508 5.26138 12.6777 5.43012L10.1594 7.88487C10.0907 7.95187 10.0593 8.04842 10.0755 8.14303L10.67 11.6092C10.7109 11.8475 10.4608 12.0291 10.2468 11.9167L7.13401 10.2802C7.04904 10.2355 6.94753 10.2355 6.86256 10.2802L3.74976 11.9167C3.53579 12.0291 3.2857 11.8475 3.32657 11.6092L3.92106 8.14303C3.93729 8.04842 3.90592 7.95187 3.83718 7.88487L1.31887 5.43012C1.14576 5.26138 1.24128 4.96739 1.48051 4.93263L4.96073 4.42692C5.05573 4.41312 5.13785 4.35345 5.18034 4.26737L6.73674 1.11376Z" data-figma-gradient-fill="{&quot;type&quot;:&quot;GRADIENT_ANGULAR&quot;,&quot;stops&quot;:[{&quot;color&quot;:{&quot;r&quot;:0.47450980544090271,&quot;g&quot;:0.55294120311737061,&quot;b&quot;:0.86274510622024536,&quot;a&quot;:1.0},&quot;position&quot;:0.0},{&quot;color&quot;:{&quot;r&quot;:0.90588235855102539,&quot;g&quot;:0.78039216995239258,&quot;b&quot;:0.56078433990478516,&quot;a&quot;:1.0},&quot;position&quot;:0.250},{&quot;color&quot;:{&quot;r&quot;:0.98039215803146362,&quot;g&quot;:0.45490196347236633,&quot;b&quot;:0.40784314274787903,&quot;a&quot;:1.0},&quot;position&quot;:0.74000000953674316},{&quot;color&quot;:{&quot;r&quot;:0.47450980544090271,&quot;g&quot;:0.55294120311737061,&quot;b&quot;:0.86274510622024536,&quot;a&quot;:1.0},&quot;position&quot;:1.0}],&quot;stopsVar&quot;:[{&quot;color&quot;:{&quot;r&quot;:0.47450980544090271,&quot;g&quot;:0.55294120311737061,&quot;b&quot;:0.86274510622024536,&quot;a&quot;:1.0},&quot;position&quot;:0.0},{&quot;color&quot;:{&quot;r&quot;:0.90588235855102539,&quot;g&quot;:0.78039216995239258,&quot;b&quot;:0.56078433990478516,&quot;a&quot;:1.0},&quot;position&quot;:0.250},{&quot;color&quot;:{&quot;r&quot;:0.98039215803146362,&quot;g&quot;:0.45490196347236633,&quot;b&quot;:0.40784314274787903,&quot;a&quot;:1.0},&quot;position&quot;:0.74000000953674316},{&quot;color&quot;:{&quot;r&quot;:0.47450980544090271,&quot;g&quot;:0.55294120311737061,&quot;b&quot;:0.86274510622024536,&quot;a&quot;:1.0},&quot;position&quot;:1.0}],&quot;transform&quot;:{&quot;m00&quot;:8.3895521163940430,&quot;m01&quot;:-8.38952636718750,&quot;m02&quot;:6.9982733726501465,&quot;m10&quot;:7.9997086524963379,&quot;m11&quot;:7.9997329711914062,&quot;m12&quot;:-1.5487323999404907},&quot;opacity&quot;:1.0,&quot;blendMode&quot;:&quot;NORMAL&quot;,&quot;visible&quot;:true}"/>
  <g clip-path="url(#paint1_angular_7977_14533_clip_path)" data-figma-skip-parse="true" mask="url(#path-1-inside-1_7977_14533)"><g transform="matrix(0.00419478 0.00399985 -0.00419476 0.00399987 6.99829 6.45099)"><foreignObject x="-3208.38" y="-3208.38" width="6416.76" height="6416.76"><div xmlns="http://www.w3.org/1999/xhtml" style="background:conic-gradient(from 90deg,rgba(121, 141, 220, 1) 0deg,rgba(231, 199, 143, 1) 90deg,rgba(250, 116, 104, 1) 266.4deg,rgba(121, 141, 220, 1) 360deg);height:100%;width:100%;opacity:1"></div></foreignObject></g></g><path d="M4.96073 4.42692L3.88114 -3.00272L4.96073 4.42692ZM5.18034 4.26737L11.9127 7.59001L5.18034 4.26737ZM1.31887 5.43012L6.55931 0.0539811L1.31887 5.43012ZM1.48051 4.93263L2.5601 12.3623L1.48051 4.93263ZM3.92106 8.14303L-3.47856 6.8739V6.8739L3.92106 8.14303ZM3.83718 7.88487L9.07762 2.50873L3.83718 7.88487ZM3.74976 11.9167L7.24339 18.5619H7.24339L3.74976 11.9167ZM3.32657 11.6092L10.7262 12.8783L3.32657 11.6092ZM7.13401 10.2802L10.6276 3.63488L10.6276 3.63488L7.13401 10.2802ZM6.86256 10.2802L3.36893 3.63488L3.36893 3.63488L6.86256 10.2802ZM10.67 11.6092L3.27038 12.8783V12.8783L10.67 11.6092ZM10.2468 11.9167L6.75318 18.5619H6.75318L10.2468 11.9167ZM10.1594 7.88487L4.91895 2.50873L4.91895 2.50873L10.1594 7.88487ZM10.0755 8.14303L17.4751 6.8739V6.8739L10.0755 8.14303ZM12.5161 4.93263L11.4365 12.3623L12.5161 4.93263ZM12.6777 5.43012L17.9181 10.8063L12.6777 5.43012ZM8.81623 4.26737L15.5486 0.944731V0.944731L8.81623 4.26737ZM9.03584 4.42692L10.1154 -3.00272L9.03584 4.42692ZM7.25983 1.11376L0.527434 4.43639L0.527434 4.4364L7.25983 1.11376ZM6.73674 1.11376L13.4691 4.43639L6.73674 1.11376ZM0.527434 4.4364L2.08383 7.59001L15.5486 0.944731L13.9922 -2.20888L0.527434 4.4364ZM7.95625 11.8566L11.4365 12.3623L13.5956 -2.49702L10.1154 -3.00272L7.95625 11.8566ZM7.43726 0.0539809L4.91895 2.50873L15.3998 13.261L17.9181 10.8063L7.43726 0.0539809ZM2.67589 9.41216L3.27038 12.8783L18.0696 10.3401L17.4751 6.8739L2.67589 9.41216ZM13.7404 5.27138L10.6276 3.63488L3.64038 16.9254L6.75318 18.5619L13.7404 5.27138ZM3.36893 3.63488L0.256131 5.27138L7.24339 18.5619L10.3562 16.9254L3.36893 3.63488ZM10.7262 12.8783L11.3207 9.41216L-3.47856 6.8739L-4.07306 10.3401L10.7262 12.8783ZM9.07762 2.50873L6.55931 0.0539811L-3.92158 10.8063L-1.40327 13.261L9.07762 2.50873ZM2.5601 12.3623L6.04032 11.8566L3.88114 -3.00272L0.400922 -2.49702L2.5601 12.3623ZM11.9127 7.59001L13.4691 4.43639L0.00433791 -2.20888L-1.55206 0.944731L11.9127 7.59001ZM6.04032 11.8566C8.58066 11.4874 10.7767 9.89192 11.9127 7.59001L-1.55206 0.944731C-0.50097 -1.18501 1.5308 -2.6612 3.88114 -3.00272L6.04032 11.8566ZM6.55931 0.0539811C10.8421 4.2287 8.47882 11.5022 2.5601 12.3623L0.400922 -2.49702C-5.99625 -1.56745 -8.55061 6.29406 -3.92158 10.8063L6.55931 0.0539811ZM11.3207 9.41216C11.7546 6.88211 10.9158 4.30052 9.07762 2.50873L-1.40327 13.261C-3.10398 11.6032 -3.88005 9.21472 -3.47856 6.8739L11.3207 9.41216ZM0.256132 5.27138C5.54998 2.48824 11.7372 6.98351 10.7262 12.8783L-4.07306 10.3401C-5.16583 16.7114 1.52159 21.5701 7.24339 18.5619L0.256132 5.27138ZM10.6276 3.63488C8.3555 2.44035 5.64107 2.44035 3.36893 3.63488L10.3562 16.9254C8.25399 18.0306 5.74258 18.0306 3.64038 16.9254L10.6276 3.63488ZM3.27038 12.8783C2.25935 6.98353 8.44658 2.48823 13.7404 5.27138L6.75318 18.5619C12.475 21.5701 19.1624 16.7114 18.0696 10.3401L3.27038 12.8783ZM4.91895 2.50873C3.08075 4.30054 2.24195 6.88212 2.67589 9.41216L17.4751 6.8739C17.8766 9.21471 17.1006 11.6032 15.3998 13.261L4.91895 2.50873ZM11.4365 12.3623C5.51777 11.5022 3.15443 4.22871 7.43726 0.0539811L17.9181 10.8063C22.5472 6.29405 19.9928 -1.56745 13.5956 -2.49702L11.4365 12.3623ZM2.08383 7.59001C3.2199 9.89192 5.41591 11.4874 7.95625 11.8566L10.1154 -3.00272C12.4658 -2.6612 14.4975 -1.18501 15.5486 0.944731L2.08383 7.59001ZM13.9922 -2.20888C11.1313 -8.00571 2.86524 -8.00571 0.00433791 -2.20888L13.4691 4.43639C10.8222 9.79966 3.17436 9.79966 0.527434 4.43639L13.9922 -2.20888Z" data-figma-gradient-fill="{&quot;type&quot;:&quot;GRADIENT_ANGULAR&quot;,&quot;stops&quot;:[{&quot;color&quot;:{&quot;r&quot;:0.47450980544090271,&quot;g&quot;:0.55294120311737061,&quot;b&quot;:0.86274510622024536,&quot;a&quot;:1.0},&quot;position&quot;:0.0},{&quot;color&quot;:{&quot;r&quot;:0.90588235855102539,&quot;g&quot;:0.78039216995239258,&quot;b&quot;:0.56078433990478516,&quot;a&quot;:1.0},&quot;position&quot;:0.250},{&quot;color&quot;:{&quot;r&quot;:0.98039215803146362,&quot;g&quot;:0.45490196347236633,&quot;b&quot;:0.40784314274787903,&quot;a&quot;:1.0},&quot;position&quot;:0.74000000953674316},{&quot;color&quot;:{&quot;r&quot;:0.47450980544090271,&quot;g&quot;:0.55294120311737061,&quot;b&quot;:0.86274510622024536,&quot;a&quot;:1.0},&quot;position&quot;:1.0}],&quot;stopsVar&quot;:[{&quot;color&quot;:{&quot;r&quot;:0.47450980544090271,&quot;g&quot;:0.55294120311737061,&quot;b&quot;:0.86274510622024536,&quot;a&quot;:1.0},&quot;position&quot;:0.0},{&quot;color&quot;:{&quot;r&quot;:0.90588235855102539,&quot;g&quot;:0.78039216995239258,&quot;b&quot;:0.56078433990478516,&quot;a&quot;:1.0},&quot;position&quot;:0.250},{&quot;color&quot;:{&quot;r&quot;:0.98039215803146362,&quot;g&quot;:0.45490196347236633,&quot;b&quot;:0.40784314274787903,&quot;a&quot;:1.0},&quot;position&quot;:0.74000000953674316},{&quot;color&quot;:{&quot;r&quot;:0.47450980544090271,&quot;g&quot;:0.55294120311737061,&quot;b&quot;:0.86274510622024536,&quot;a&quot;:1.0},&quot;position&quot;:1.0}],&quot;transform&quot;:{&quot;m00&quot;:8.3895521163940430,&quot;m01&quot;:-8.38952636718750,&quot;m02&quot;:6.9982733726501465,&quot;m10&quot;:7.9997086524963379,&quot;m11&quot;:7.9997329711914062,&quot;m12&quot;:-1.5487323999404907},&quot;opacity&quot;:1.0,&quot;blendMode&quot;:&quot;NORMAL&quot;,&quot;visible&quot;:true}" mask="url(#path-1-inside-1_7977_14533)"/>
  <defs>
    <clipPath id="paint0_angular_7977_14533_clip_path"><path d="M6.73674 1.11376C6.84373 0.896977 7.15285 0.896977 7.25983 1.11376L8.81623 4.26737C8.85872 4.35345 8.94084 4.41312 9.03584 4.42692L12.5161 4.93263C12.7553 4.96739 12.8508 5.26138 12.6777 5.43012L10.1594 7.88487C10.0907 7.95187 10.0593 8.04842 10.0755 8.14303L10.67 11.6092C10.7109 11.8475 10.4608 12.0291 10.2468 11.9167L7.13401 10.2802C7.04904 10.2355 6.94753 10.2355 6.86256 10.2802L3.74976 11.9167C3.53579 12.0291 3.2857 11.8475 3.32657 11.6092L3.92106 8.14303C3.93729 8.04842 3.90592 7.95187 3.83718 7.88487L1.31887 5.43012C1.14576 5.26138 1.24128 4.96739 1.48051 4.93263L4.96073 4.42692C5.05573 4.41312 5.13785 4.35345 5.18034 4.26737L6.73674 1.11376Z"/></clipPath><clipPath id="paint1_angular_7977_14533_clip_path"><path d="M4.96073 4.42692L3.88114 -3.00272L4.96073 4.42692ZM5.18034 4.26737L11.9127 7.59001L5.18034 4.26737ZM1.31887 5.43012L6.55931 0.0539811L1.31887 5.43012ZM1.48051 4.93263L2.5601 12.3623L1.48051 4.93263ZM3.92106 8.14303L-3.47856 6.8739V6.8739L3.92106 8.14303ZM3.83718 7.88487L9.07762 2.50873L3.83718 7.88487ZM3.74976 11.9167L7.24339 18.5619H7.24339L3.74976 11.9167ZM3.32657 11.6092L10.7262 12.8783L3.32657 11.6092ZM7.13401 10.2802L10.6276 3.63488L10.6276 3.63488L7.13401 10.2802ZM6.86256 10.2802L3.36893 3.63488L3.36893 3.63488L6.86256 10.2802ZM10.67 11.6092L3.27038 12.8783V12.8783L10.67 11.6092ZM10.2468 11.9167L6.75318 18.5619H6.75318L10.2468 11.9167ZM10.1594 7.88487L4.91895 2.50873L4.91895 2.50873L10.1594 7.88487ZM10.0755 8.14303L17.4751 6.8739V6.8739L10.0755 8.14303ZM12.5161 4.93263L11.4365 12.3623L12.5161 4.93263ZM12.6777 5.43012L17.9181 10.8063L12.6777 5.43012ZM8.81623 4.26737L15.5486 0.944731V0.944731L8.81623 4.26737ZM9.03584 4.42692L10.1154 -3.00272L9.03584 4.42692ZM7.25983 1.11376L0.527434 4.43639L0.527434 4.4364L7.25983 1.11376ZM6.73674 1.11376L13.4691 4.43639L6.73674 1.11376ZM0.527434 4.4364L2.08383 7.59001L15.5486 0.944731L13.9922 -2.20888L0.527434 4.4364ZM7.95625 11.8566L11.4365 12.3623L13.5956 -2.49702L10.1154 -3.00272L7.95625 11.8566ZM7.43726 0.0539809L4.91895 2.50873L15.3998 13.261L17.9181 10.8063L7.43726 0.0539809ZM2.67589 9.41216L3.27038 12.8783L18.0696 10.3401L17.4751 6.8739L2.67589 9.41216ZM13.7404 5.27138L10.6276 3.63488L3.64038 16.9254L6.75318 18.5619L13.7404 5.27138ZM3.36893 3.63488L0.256131 5.27138L7.24339 18.5619L10.3562 16.9254L3.36893 3.63488ZM10.7262 12.8783L11.3207 9.41216L-3.47856 6.8739L-4.07306 10.3401L10.7262 12.8783ZM9.07762 2.50873L6.55931 0.0539811L-3.92158 10.8063L-1.40327 13.261L9.07762 2.50873ZM2.5601 12.3623L6.04032 11.8566L3.88114 -3.00272L0.400922 -2.49702L2.5601 12.3623ZM11.9127 7.59001L13.4691 4.43639L0.00433791 -2.20888L-1.55206 0.944731L11.9127 7.59001ZM6.04032 11.8566C8.58066 11.4874 10.7767 9.89192 11.9127 7.59001L-1.55206 0.944731C-0.50097 -1.18501 1.5308 -2.6612 3.88114 -3.00272L6.04032 11.8566ZM6.55931 0.0539811C10.8421 4.2287 8.47882 11.5022 2.5601 12.3623L0.400922 -2.49702C-5.99625 -1.56745 -8.55061 6.29406 -3.92158 10.8063L6.55931 0.0539811ZM11.3207 9.41216C11.7546 6.88211 10.9158 4.30052 9.07762 2.50873L-1.40327 13.261C-3.10398 11.6032 -3.88005 9.21472 -3.47856 6.8739L11.3207 9.41216ZM0.256132 5.27138C5.54998 2.48824 11.7372 6.98351 10.7262 12.8783L-4.07306 10.3401C-5.16583 16.7114 1.52159 21.5701 7.24339 18.5619L0.256132 5.27138ZM10.6276 3.63488C8.3555 2.44035 5.64107 2.44035 3.36893 3.63488L10.3562 16.9254C8.25399 18.0306 5.74258 18.0306 3.64038 16.9254L10.6276 3.63488ZM3.27038 12.8783C2.25935 6.98353 8.44658 2.48823 13.7404 5.27138L6.75318 18.5619C12.475 21.5701 19.1624 16.7114 18.0696 10.3401L3.27038 12.8783ZM4.91895 2.50873C3.08075 4.30054 2.24195 6.88212 2.67589 9.41216L17.4751 6.8739C17.8766 9.21471 17.1006 11.6032 15.3998 13.261L4.91895 2.50873ZM11.4365 12.3623C5.51777 11.5022 3.15443 4.22871 7.43726 0.0539811L17.9181 10.8063C22.5472 6.29405 19.9928 -1.56745 13.5956 -2.49702L11.4365 12.3623ZM2.08383 7.59001C3.2199 9.89192 5.41591 11.4874 7.95625 11.8566L10.1154 -3.00272C12.4658 -2.6612 14.4975 -1.18501 15.5486 0.944731L2.08383 7.59001ZM13.9922 -2.20888C11.1313 -8.00571 2.86524 -8.00571 0.00433791 -2.20888L13.4691 4.43639C10.8222 9.79966 3.17436 9.79966 0.527434 4.43639L13.9922 -2.20888Z" data-figma-gradient-fill="{&quot;type&quot;:&quot;GRADIENT_ANGULAR&quot;,&quot;stops&quot;:[{&quot;color&quot;:{&quot;r&quot;:0.47450980544090271,&quot;g&quot;:0.55294120311737061,&quot;b&quot;:0.86274510622024536,&quot;a&quot;:1.0},&quot;position&quot;:0.0},{&quot;color&quot;:{&quot;r&quot;:0.90588235855102539,&quot;g&quot;:0.78039216995239258,&quot;b&quot;:0.56078433990478516,&quot;a&quot;:1.0},&quot;position&quot;:0.250},{&quot;color&quot;:{&quot;r&quot;:0.98039215803146362,&quot;g&quot;:0.45490196347236633,&quot;b&quot;:0.40784314274787903,&quot;a&quot;:1.0},&quot;position&quot;:0.74000000953674316},{&quot;color&quot;:{&quot;r&quot;:0.47450980544090271,&quot;g&quot;:0.55294120311737061,&quot;b&quot;:0.86274510622024536,&quot;a&quot;:1.0},&quot;position&quot;:1.0}],&quot;stopsVar&quot;:[{&quot;color&quot;:{&quot;r&quot;:0.47450980544090271,&quot;g&quot;:0.55294120311737061,&quot;b&quot;:0.86274510622024536,&quot;a&quot;:1.0},&quot;position&quot;:0.0},{&quot;color&quot;:{&quot;r&quot;:0.90588235855102539,&quot;g&quot;:0.78039216995239258,&quot;b&quot;:0.56078433990478516,&quot;a&quot;:1.0},&quot;position&quot;:0.250},{&quot;color&quot;:{&quot;r&quot;:0.98039215803146362,&quot;g&quot;:0.45490196347236633,&quot;b&quot;:0.40784314274787903,&quot;a&quot;:1.0},&quot;position&quot;:0.74000000953674316},{&quot;color&quot;:{&quot;r&quot;:0.47450980544090271,&quot;g&quot;:0.55294120311737061,&quot;b&quot;:0.86274510622024536,&quot;a&quot;:1.0},&quot;position&quot;:1.0}],&quot;transform&quot;:{&quot;m00&quot;:8.3895521163940430,&quot;m01&quot;:-8.38952636718750,&quot;m02&quot;:6.9982733726501465,&quot;m10&quot;:7.9997086524963379,&quot;m11&quot;:7.9997329711914062,&quot;m12&quot;:-1.5487323999404907},&quot;opacity&quot;:1.0,&quot;blendMode&quot;:&quot;NORMAL&quot;,&quot;visible&quot;:true}" mask="url(#path-1-inside-1_7977_14533)"/>
    </svg>`
    }
  }
  return starsHTML
}

type CartAddon = {
  id: string
  count?: number
  fullData: {
    _key: string
    name: string
  }
}

export type ExtendedHotelData = BaseHotelProps & {
  imageList: ImageDataProps
  cartAddons?: CartAddon[]
  fullAddonList: AddonItem[]
}

export type ExtendedActivityData = BaseActivityProps & {
  imageList: ImageDataProps
  fullAddonList: AddonItem[]
  cartAddons?: CartAddon[]
}

type CartItem = ExtendedHotelData | ExtendedActivityData
type ItemType = 'hotels' | 'activities'

// Shared function to setup addons button
function setupAddonsButton(item: CartItem, itemType: ItemType, addonsButton: Element, t: Record<string, any>) {
  if (!item.addons?.hasAddons) {
    addonsButton.remove()
    return
  }

  const hasAddons = Boolean(item.addons?.hasAddons && Array.isArray(item.cartAddons) && item.cartAddons.length > 0)
  addonsButton.setAttribute('data-is-editing', String(hasAddons))

  const span = addonsButton.querySelector('.text')
  if (span) {
    span.innerHTML = hasAddons ? t.editAddons : `${t.addons} <strong>${t.optional}</strong>`
  }

  addonsButton.addEventListener('click', () => {
    const hasAddonsValue = Boolean(item.addons?.hasAddons)
    const minOneAddonValue = Boolean(item.addons?.minOneAddon)
    const addonsChoice = item.addons?.addonsChoice || 'unlimited'

    dispatchAddonsPopup({
      itemId: item._id,
      itemType,
      hasAddons: hasAddonsValue,
      isEditing: true,
      minOneAddon: minOneAddonValue,
      requiresAddons: minOneAddonValue,
      addonsChoice,
      addonData: item.addons,
    })
  })
}

// Shared function to setup remove button
function setupRemoveButton(item: CartItem, itemType: ItemType, removeButton: Element) {
  removeButton.addEventListener('click', () => {
    const confirmationContainer = document.querySelector('.remove-confirmation-container') as HTMLElement | null
    if (!confirmationContainer) return

    const hasAddons = Boolean(item.addons?.hasAddons && Array.isArray(item.cartAddons) && item.cartAddons.length > 0)

    confirmationContainer.setAttribute('data-id', item._id)
    confirmationContainer.setAttribute('data-type', itemType)
    confirmationContainer.setAttribute('data-has-addons', hasAddons.toString())
    confirmationContainer.setAttribute('data-name', item.name)

    document.dispatchEvent(
      new CustomEvent('change-confirmation-data', {
        detail: {
          type: itemType,
          name: item.name,
          hasAddons,
        },
      })
    )

    const hiddenTrigger = confirmationContainer.querySelector('.hidden-trigger button') as HTMLButtonElement | null
    if (hiddenTrigger) {
      hiddenTrigger.click()
    }
  })
}

// Shared function to setup addon list
function setupAddonList(item: CartItem, addonList: Element) {
  if (!item.addons?.hasAddons || !item.cartAddons?.length) return

  item.addons.addonsList?.forEach((addon) => {
    const li = document.createElement('li')
    const hasCount = item.cartAddons?.find((cartAddon) => cartAddon.fullData._key === addon._key)?.count
    li.innerHTML = hasCount ? `${addon.name}: <strong>${hasCount}</strong>` : addon.name
    addonList.appendChild(li)
  })
}

// Shared function to setup item attributes
function setupItemAttributes(item: CartItem, itemElement: Element) {
  itemElement.setAttribute('data-item-id', item._id)

  // Add max people data attribute for hotels
  if ('maxPeople' in item && item.maxPeople?.overnight) {
    itemElement.setAttribute('data-max-people', String(item.maxPeople.overnight))
  }

  if (item.addons?.hasAddons && Array.isArray(item.addons.addonsList) && item.addons.addonsList.length > 0) {
    const addonNames = item.addons.fullAddonsList?.map((addon) => ({ name: addon.name, id: addon._key }))
    itemElement.setAttribute('data-addon-names', JSON.stringify(addonNames))
  }
}

// Shared function to setup image
async function setupImage(item: CartItem, imgWrapper: Element) {
  if (!item.imageList || !imgWrapper) return

  const optimizedImage = await optimizeImage({
    image: item.imageList.asset.url,
    width: item.imageList.asset.metadata.dimensions.width,
    height: item.imageList.asset.metadata.dimensions.height,
  })

  const img = document.createElement('img')
  img.src = optimizedImage.src
  img.srcset = optimizedImage.srcSet.attribute
  img.sizes = '208px'
  img.alt = item.name
  img.loading = 'lazy'
  imgWrapper.appendChild(img)
}

// Shared function to setup name and href
function setupNameAndHref(item: CartItem, nameElement: Element) {
  if (!nameElement) return

  nameElement.textContent = item.name

  if (nameElement instanceof HTMLAnchorElement) {
    nameElement.href = item.slug
  }
}

// Function to render a single hotel
export async function renderHotel(hotel: ExtendedHotelData, t: Record<string, any>): Promise<DocumentFragment | null> {
  const templateElement = document.getElementById('hotel-template') as HTMLTemplateElement | null
  if (!templateElement) return null

  const clone = templateElement.content.cloneNode(true) as DocumentFragment
  const item = clone.querySelector('.hotel-item')!

  // Setup common elements
  setupItemAttributes(hotel, item)
  await setupImage(hotel, clone.querySelector('.img-wrapper')!)
  setupAddonList(hotel, clone.querySelector('.addon-list')!)
  setupAddonsButton(hotel, 'hotels', clone.querySelector('.addons')!, t)
  setupRemoveButton(hotel, 'hotels', clone.querySelector('.remove')!)
  setupNameAndHref(hotel, clone.querySelector('.name')!)

  // Set stars
  if (hotel.stars) {
    const starsElement = clone.querySelector('.stars')
    if (starsElement) {
      starsElement.innerHTML = createStarRating(hotel.stars)
    }
  }

  // Set location and details
  const details = clone.querySelectorAll('.details li')

  if (details[0] && hotel.address) {
    details[0].innerHTML +=
      hotel.address.city +
      ', ' +
      hotel.address.voivodeship.slice(0, 1).toUpperCase() +
      hotel.address.voivodeship.slice(1)
  }

  if (details[1]) {
    const priceText = hotel.pricing?.pricePerPerson ? `${t.from} ${hotel.pricing.pricePerPerson} ${t.perNight}` : ''
    details[1].innerHTML += priceText
  }

  if (details[2]) {
    const maxPeople = hotel.maxPeople?.overnight || 0
    details[2].innerHTML += `${t.max} ${maxPeople} ${maxPeople === 1 ? t.person : t.people}`
  }

  // Render alerts if they exist
  if (hotel.alerts && hotel.alerts.length > 0) {
    const alertsList = clone.querySelector('.alerts')
    if (alertsList) {
      renderAlerts(hotel.alerts, alertsList)
    }
  }

  return clone
}

// Function to render a single activity
export async function renderActivity(
  activity: ExtendedActivityData,
  t: Record<string, any>
): Promise<DocumentFragment | null> {
  const templateElement = document.getElementById('activity-template') as HTMLTemplateElement | null
  if (!templateElement) return null

  const clone = templateElement.content.cloneNode(true) as DocumentFragment
  const item = clone.querySelector('.activity-item')!

  // Setup common elements
  setupItemAttributes(activity, item)
  await setupImage(activity, clone.querySelector('.img-wrapper')!)
  setupAddonList(activity, clone.querySelector('.addon-list')!)
  setupAddonsButton(activity, 'activities', clone.querySelector('.addons')!, t)
  setupRemoveButton(activity, 'activities', clone.querySelector('.remove')!)
  setupNameAndHref(activity, clone.querySelector('.name')!)

  // Set participants range
  const participantsSpan = clone.querySelector('.participants span')
  if (participantsSpan && activity.participantsCount) {
    participantsSpan.textContent = `${activity.participantsCount.min}–${activity.participantsCount.max} ${t.people}`
  }

  // Render alerts if they exist
  if (activity.alerts && activity.alerts.length > 0) {
    const alertsList = clone.querySelector('.alerts')
    if (alertsList) {
      renderAlerts(activity.alerts, alertsList)
    }
  }

  return clone
}

// Helper function to render alerts - enhanced and exported
export function renderAlerts(alerts: Alert[], alertsContainer: Element, customClass?: string): void {
  for (const alert of alerts) {
    const alertTemplate = document.getElementById('alert-template')! as HTMLTemplateElement
    const alertItem = alertTemplate?.content.cloneNode(true) as HTMLElement
    const alertWrapper = alertItem.querySelector('.wrapper')!

    // Add custom class if provided
    if (customClass) {
      alertItem.querySelector('li')?.classList.add(customClass)
    }

    // Handle heading - can be string or PortableText
    const alertHeading = alertWrapper.querySelector('.alert-heading')!
    alertHeading.innerHTML = typeof alert.heading === 'string' ? alert.heading : toHTMLClient(alert.heading)

    // Handle paragraph - can be string or PortableText
    const alertParagraph = alertWrapper.querySelector('.alert-paragraph')!
    alertParagraph.innerHTML = typeof alert.paragraph === 'string' ? alert.paragraph : toHTMLClient(alert.paragraph)

    // Handle CTA link
    const ctaLink = alertWrapper.querySelector('a')!
    ctaLink.querySelector('span')!.textContent =
      typeof alert.cta.text === 'string' ? alert.cta.text : String(alert.cta.text || '')

    // Set href based on link type or direct href
    ctaLink.href = alert.cta.internalReference?.slug || (alert.cta as any).href || '#'

    alertsContainer.appendChild(alertItem)
  }
}
