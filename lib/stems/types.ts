export type StemKind="vocal"|"music";
export type Stem={id:string;name:string;detected:string;kind:StemKind;url?:string;volume:number;muted:boolean;solo:boolean};
export const DEFAULT_STEMS:Stem[]=[
{id:"v1",name:"Vocal 1",detected:"Vokal utama",kind:"vocal",volume:80,muted:false,solo:false},
{id:"v2",name:"Vocal 2",detected:"Vokal kedua",kind:"vocal",volume:80,muted:false,solo:false},
{id:"v3",name:"Vocal 3",detected:"Vokal ketiga",kind:"vocal",volume:80,muted:false,solo:false},
{id:"m1",name:"Musik 1",detected:"Belum dianalisis",kind:"music",volume:80,muted:false,solo:false},
{id:"m2",name:"Musik 2",detected:"Belum dianalisis",kind:"music",volume:80,muted:false,solo:false},
{id:"m3",name:"Musik 3",detected:"Belum dianalisis",kind:"music",volume:80,muted:false,solo:false},
{id:"m4",name:"Musik 4",detected:"Belum dianalisis",kind:"music",volume:80,muted:false,solo:false},
{id:"m5",name:"Musik 5",detected:"Sisa instrumen / efek",kind:"music",volume:80,muted:false,solo:false}
];