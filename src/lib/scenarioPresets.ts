import { ScenarioEvent } from "./store";

// 임시 id 및 시간 생성용 유틸리티 (관리자 페이지에서 불러올 때 덮어씌워짐)
const createDummyEvent = (
    title: string,
    sub_types: string[],
    roles: ScenarioEvent['roles']
): Partial<ScenarioEvent> => ({
    title,
    sub_types,
    category: 'phase_1',
    delivery_type: 'instant',
    scheduled_delay_min: 0,
    roles
});

export const PHASE1_PRESET: Partial<ScenarioEvent>[] = [
    {
        title: '로지스포인트 암남 6층 작업구역 화재 발생 신고',
        description: '09:30경 로지스포인트 암남 6층 작업구역에서 화재 발생. 검은 연기 다량 분출, 내부에 대피하지 못한 직원이 있다는 신고 접수.',
        sub_types: ['최초신고'],
        category: 'phase_1',
        delivery_type: 'instant',
        scheduled_delay_min: 0,
        roles: [
            {
                roleName: '상황실',
                tasks: [
                    { label: '대상물명·주소·발생층 확인' },
                    { label: '재난유형을 \'창고화재\'로 1차 분류' },
                    { label: '신고자 연락 유지 여부 확인' },
                    { label: '지휘대에 최초정보 전파' }
                ]
            },
            {
                roleName: '현장지휘대',
                tasks: [
                    { label: '6층 창고화재로 초기 상황 인지' },
                    { label: '인명구조 우선 가능성 검토' },
                    { label: '초기 출동규모 적정성 검토' }
                ]
            },
            {
                roleName: '선착분대',
                tasks: [
                    { label: '출동 준비 완료' },
                    { label: '화재진압·초기검색 준비' }
                ]
            },
            {
                roleName: '구조대',
                tasks: [
                    { label: '내부 고립자 구조 가능성 인지' },
                    { label: '구조장비 적재 확인' }
                ]
            },
            {
                roleName: '구급대',
                tasks: [
                    { label: '연기흡입·다수환자 가능성 인지' },
                    { label: '응급처치 장비 확인' }
                ]
            }
        ]
    },
    {
        title: '6층 작업자 연락 두절 및 다수 인명피해 우려',
        description: '6층 작업자 일부 연락 두절. 7층 상부로 연기 유입 중이며 계단 대피 지연 인원 발생 가능. 다수 인명피해 우려.',
        sub_types: ['인명피해우려'],
        category: 'phase_1',
        delivery_type: 'instant',
        scheduled_delay_min: 0,
        roles: [
            {
                roleName: '상황실',
                tasks: [
                    { label: '연락두절 인원 수 파악 시도' },
                    { label: '6층·7층 인원정보 구분 정리' },
                    { label: '구조 우선 정보로 재전파' }
                ]
            },
            {
                roleName: '현장지휘대',
                tasks: [
                    { label: '\'진압 단독\'이 아닌 \'구조 병행\' 전략 검토' },
                    { label: '구조대·구급대 추가 필요성 검토' }
                ]
            },
            {
                roleName: '선착분대',
                tasks: [
                    { label: '인명구조 우선 방면 설정 준비' },
                    { label: '대피유도 병행 가능성 검토' }
                ]
            },
            {
                roleName: '구조대',
                tasks: [
                    { label: '열화상카메라·들것·구조장비 재확인' },
                    { label: '고립자 탐색 우선 준비' }
                ]
            },
            {
                roleName: '구급대',
                tasks: [
                    { label: '다수사상자 대응 전환 준비' },
                    { label: '환자 분류·처치 공간 구상' }
                ]
            }
        ]
    },
    {
        title: '대상물 건축구조 및 현장 진입동선 정보',
        description: '로지스포인트 암남은 지상 8층 대형 물류창고. 6층은 중층구조, 주출입구는 동측 대로변 1개소. 내부 규모가 커 현장지휘 사각 발생 우려.',
        sub_types: ['대상물정보'],
        category: 'phase_1',
        delivery_type: 'instant',
        scheduled_delay_min: 0,
        roles: [
            {
                roleName: '상황실',
                tasks: [
                    { label: '건물 구조·층별 용도 전파' },
                    { label: '6층 중층구조 정보 전파' },
                    { label: '동측 주출입구 1개소 정보 전파' }
                ]
            },
            {
                roleName: '현장지휘대',
                tasks: [
                    { label: '방면구역 설정 필요성 검토' },
                    { label: '고정지휘 위치 사전 구상' },
                    { label: '단일 진입동선 혼잡 가능성 검토' }
                ]
            },
            {
                roleName: '선착분대',
                tasks: [
                    { label: '진입 동선 제한 가능성 인지' },
                    { label: '내부 탐색 시 방향 상실 위험 인지' }
                ]
            },
            {
                roleName: '구조대',
                tasks: [
                    { label: '중층구조 내 탐색 난도 인지' },
                    { label: '상·하부 구조 구분 탐색 준비' }
                ]
            },
            {
                roleName: '구급대',
                tasks: [
                    { label: '동측 주출입구 혼잡 예상 반영' },
                    { label: '환자 집결·인계 위치 후보 검토' }
                ]
            }
        ]
    },
    {
        title: '건물 내부 위험요소 및 급격한 연소확대 우려',
        description: '밀폐형 창고 구조, 배연 곤란, 다량 가연물 적재, 패널 마감재 사용. 은폐화염·급격한 연소확대·유독가스 발생 우려.',
        sub_types: ['위험정보'],
        category: 'phase_1',
        delivery_type: 'instant',
        scheduled_delay_min: 0,
        roles: [
            {
                roleName: '상황실',
                tasks: [
                    { label: '위험요소를 \'배연곤란/패널/은폐화염\'으로 구분 전파' },
                    { label: '건물 관계자 통해 설비 작동 여부 확인 시도' }
                ]
            },
            {
                roleName: '현장지휘대',
                tasks: [
                    { label: '무리한 내부진입 제한 검토' },
                    { label: 'TIC 활용 전제 작전 검토' },
                    { label: '환기·배연 전략 사전 검토' }
                ]
            },
            {
                roleName: '선착분대',
                tasks: [
                    { label: '시야 확보 전 무리한 진입 금지 인지' },
                    { label: '패널 벽체·천장부 화재확산 가능성 인지' }
                ]
            },
            {
                roleName: '구조대',
                tasks: [
                    { label: 'TIC 우선 활용 준비' },
                    { label: '고온·유독가스 환경 구조 대비' }
                ]
            },
            {
                roleName: '구급대',
                tasks: [
                    { label: '연기흡입·열손상 환자 증가 가능성 대비' }
                ]
            }
        ]
    },
    {
        title: '중부지휘 및 관할 출동대 즉시 출동 지령',
        description: '로지스포인트 암남 6층 창고화재. 중부지휘, 관할 선착분대, 구조대, 구급대 즉시 출동. 내부 고립자 우려, 7층 연기 유입 가능.',
        sub_types: ['출동지령'],
        category: 'phase_1',
        delivery_type: 'instant',
        scheduled_delay_min: 0,
        roles: [
            {
                roleName: '상황실',
                tasks: [
                    { label: '1차 출동대 편성 완료' },
                    { label: '출동지령 송출 및 응답 확인' },
                    { label: '구조·구급 포함 여부 확인' }
                ]
            },
            {
                roleName: '현장지휘대',
                tasks: [
                    { label: '출동 중 상황전파 준비' },
                    { label: '현장 도착 즉시 지휘권 선언 준비' }
                ]
            },
            {
                roleName: '선착분대',
                tasks: [
                    { label: '즉시 출동' },
                    { label: '개인안전장비 착용 확인' },
                    { label: '초기 화점 확인·보고 준비' }
                ]
            },
            {
                roleName: '구조대',
                tasks: [
                    { label: '구조장비 적재 확인' },
                    { label: '구조대상자 탐색 준비' }
                ]
            },
            {
                roleName: '구급대',
                tasks: [
                    { label: '응급처치 장비 확인' },
                    { label: '다수환자 대비 보고체계 준비' }
                ]
            }
        ]
    },
    {
        title: '상층부 연기 유입 및 대피 지연자 발생 신고',
        description: '6층 내부 시야 확보 곤란. 7층 사무·작업구역까지 연기 유입. 일부 직원은 계단 대피 중, 일부는 위치 확인 불가.',
        sub_types: ['추가신고'],
        category: 'phase_1',
        delivery_type: 'instant',
        scheduled_delay_min: 0,
        roles: [
            {
                roleName: '상황실',
                tasks: [
                    { label: '신규 정보만 선별 정리' },
                    { label: '6층 화재 + 7층 연기 유입으로 상황 상향 전파' }
                ]
            },
            {
                roleName: '현장지휘대',
                tasks: [
                    { label: '단일층 화재가 아닌 상층 영향 상황으로 재판단' },
                    { label: '방면 확대 가능성 검토' }
                ]
            },
            {
                roleName: '선착분대',
                tasks: [
                    { label: '대피유도 필요성 인지' },
                    { label: '상층부 확인 필요성 인지' }
                ]
            },
            {
                roleName: '구조대',
                tasks: [
                    { label: '상층 탐색 가능성 검토' },
                    { label: '계단실 활용 구조 동선 검토' }
                ]
            },
            {
                roleName: '구급대',
                tasks: [
                    { label: '계단 대피자 응급평가 대비' }
                ]
            }
        ]
    },
    {
        title: '특수차량 및 구조·구급대 추가 출동 지령',
        description: '대상 규모가 크고 고립자 다수 우려. 추가 구조대·추가 구급대·특수차 출동 검토 또는 지령.',
        sub_types: ['추가출동'],
        category: 'phase_1',
        delivery_type: 'instant',
        scheduled_delay_min: 0,
        roles: [
            {
                roleName: '상황실',
                tasks: [
                    { label: '추가 구조대 필요성 검토' },
                    { label: '추가 구급대 필요성 검토' },
                    { label: '특수차 출동 필요성 검토' },
                    { label: '인근서 지원 가능 여부 확인' }
                ]
            },
            {
                roleName: '현장지휘대',
                tasks: [
                    { label: '현재 자원으로 대응 가능 여부 판단' },
                    { label: '대형 대상물 대응으로 전략 재조정 검토' }
                ]
            },
            {
                roleName: '선착분대',
                tasks: [
                    { label: '후착대 연계 전제 초기활동 준비' }
                ]
            },
            {
                roleName: '구조대',
                tasks: [
                    { label: '구조대 증원 필요성 보고 준비' }
                ]
            },
            {
                roleName: '구급대',
                tasks: [
                    { label: '환자 증가 대비 구급자원 증원 필요성 보고 준비' }
                ]
            }
        ]
    },
    {
        title: '경찰 및 유관기관 등 현장 지원 협조 통보',
        description: '동측 주출입구 차량 집중 예상. 경찰 교통통제, 구청 현장지원, 전기·가스 차단 관계기관 협조 필요.',
        sub_types: ['지원기관요청'],
        category: 'phase_1',
        delivery_type: 'instant',
        scheduled_delay_min: 0,
        roles: [
            {
                roleName: '상황실',
                tasks: [
                    { label: '경찰 교통통제 요청 준비' },
                    { label: '구청 현장지원 요청 준비' },
                    { label: '한전·가스 관계기관 통보 준비' }
                ]
            },
            {
                roleName: '현장지휘대',
                tasks: [
                    { label: '현장 통제선 설정 필요성 검토' },
                    { label: '주출입구 혼잡관리 계획 검토' }
                ]
            },
            {
                roleName: '선착분대',
                tasks: [
                    { label: '주민·관계자 출입통제 준비' }
                ]
            },
            {
                roleName: '구급대',
                tasks: [
                    { label: '구급차 진입·이송 동선 확보 필요성 인지' }
                ]
            },
            {
                roleName: '통제단 준비요원',
                tasks: [
                    { label: '지원기관 연락·조정 준비' }
                ]
            }
        ]
    },
    {
        title: '출동대별 초기 대응 및 현장 임무 사전 부여',
        description: '선착대는 도착 즉시 지휘권 선언 및 최초상황보고. 구조대는 인명검색 우선. 구급대는 다수사상자 대비 및 임시의료소 준비.',
        sub_types: ['임무부여'],
        category: 'phase_1',
        delivery_type: 'instant',
        scheduled_delay_min: 0,
        roles: [
            {
                roleName: '현장지휘대',
                tasks: [
                    { label: '선착대 임무 부여' },
                    { label: '구조대 임무 부여' },
                    { label: '구급대 임무 부여' },
                    { label: '후착대 연계 준비 지시' }
                ]
            },
            {
                roleName: '선착분대',
                tasks: [
                    { label: '도착 즉시 현장상황 보고 준비' },
                    { label: '지휘권 확립 준비' },
                    { label: '화점·연기·대피상황 확인 준비' }
                ]
            },
            {
                roleName: '구조대',
                tasks: [
                    { label: '인명검색 우선 준비' },
                    { label: '고립자 구조 동선 검토' }
                ]
            },
            {
                roleName: '구급대',
                tasks: [
                    { label: '임시의료소 후보 위치 검토' },
                    { label: '환자 분류체계 준비' }
                ]
            }
        ]
    },
    {
        title: '현장 지휘망 통일 및 유관기관 공통 채널 지정',
        description: '현장상황 보고는 지정 지휘망으로 통일. 관계기관은 공통 통신채널 입장 준비. 무전 혼선 방지.',
        sub_types: ['무전채널운영'],
        category: 'phase_1',
        delivery_type: 'instant',
        scheduled_delay_min: 0,
        roles: [
            {
                roleName: '상황실',
                tasks: [
                    { label: '지휘망 지정' },
                    { label: '작전망 필요 여부 검토' },
                    { label: '관계기관 채널 공유 준비' }
                ]
            },
            {
                roleName: '현장지휘대',
                tasks: [
                    { label: '무전보고 기준 설정 준비' },
                    { label: '핵심보고 위주 운용 지시 준비' }
                ]
            },
            {
                roleName: '선착분대',
                tasks: [
                    { label: '간결한 최초보고 준비' },
                    { label: '불필요한 무전 자제' }
                ]
            },
            {
                roleName: '구조대',
                tasks: [
                    { label: '탐색·구조상황 핵심보고 기준 숙지' }
                ]
            },
            {
                roleName: '구급대',
                tasks: [
                    { label: '환자 수·중증도 중심 보고 준비' }
                ]
            }
        ]
    }
];

export const PHASE2_PRESET: Partial<ScenarioEvent>[] = [
    {
        title: '출동 중 6층 화점 및 상층 연기 유입 상황 전파',
        description: '지휘차 및 출동대에 추가 상황 전파. 6층 작업구역이 주 화점으로 추정되며, 7층 사무·작업구역까지 연기 유입이 시작됨.',
        sub_types: ['상황전파'],
        category: 'phase_2',
        delivery_type: 'instant',
        scheduled_delay_min: 0,
        roles: [
            {
                roleName: '상황실',
                tasks: [
                    { label: '6층 화점 추정 정보 전파' },
                    { label: '7층 연기 유입 정보 전파' },
                    { label: '출동대별 수신 여부 확인' }
                ]
            },
            {
                roleName: '현장지휘대',
                tasks: [
                    { label: '단일층 화재가 아닌 상층 영향 상황으로 재판단' },
                    { label: '출동 중 방면 확대 가능성 검토' }
                ]
            },
            {
                roleName: '선착분대',
                tasks: [
                    { label: '6층 진입 및 7층 확인 병행 가능성 인지' },
                    { label: '연기 확산 방향 확인 준비' }
                ]
            },
            {
                roleName: '구조대',
                tasks: [
                    { label: '상층 탐색 가능성 반영' },
                    { label: '계단실 중심 구조 동선 검토' }
                ]
            },
            {
                roleName: '구급대',
                tasks: [
                    { label: '상층 대피자 응급평가 가능성 대비' }
                ]
            }
        ]
    },
    {
        title: '건물 관계자 1차 진술 확보',
        description: '건물 관계자 진술: 6층 작업구역에서 최초 화염 확인, 내부 시야 확보 곤란. 7층 일부 직원은 계단 대피 중이며, 연락 두절 인원 존재.',
        sub_types: ['관계자진술'],
        category: 'phase_2',
        delivery_type: 'instant',
        scheduled_delay_min: 0,
        roles: [
            {
                roleName: '상황실',
                tasks: [
                    { label: '관계자 진술 핵심내용 정리' },
                    { label: '최초 화염 확인 위치 기록' },
                    { label: '연락 두절 정보 재전파' }
                ]
            },
            {
                roleName: '현장지휘대',
                tasks: [
                    { label: '관계자 진술을 반영해 초기 검색 우선구역 검토' },
                    { label: '계단 대피와 내부 고립 상황을 구분 인지' }
                ]
            },
            {
                roleName: '선착분대',
                tasks: [
                    { label: '관계자 지목 구역 우선 확인 준비' },
                    { label: '자력 대피 인원 유도 가능성 검토' }
                ]
            },
            {
                roleName: '구조대',
                tasks: [
                    { label: '관계자 진술 기준 구조 우선구역 정리' },
                    { label: '연락 두절 인원 위치 추정 준비' }
                ]
            },
            {
                roleName: '구급대',
                tasks: [
                    { label: '자력 대피자 중 연기흡입 환자 발생 가능성 대비' }
                ]
            }
        ]
    },
    {
        title: '구조대상자 세부 정보 갱신',
        description: '구조대상자 정보 갱신. 6층 작업자 4명 위치 미확인, 7층 사무·작업구역 6명 대피 지연 가능성, 계단 대피 중 연기흡입 호소자 발생 우려.',
        sub_types: ['구조대상자정보'],
        category: 'phase_2',
        delivery_type: 'instant',
        scheduled_delay_min: 0,
        roles: [
            {
                roleName: '상황실',
                tasks: [
                    { label: '6층 미확인 인원 수 정리' },
                    { label: '7층 대피 지연 인원 정보 정리' },
                    { label: '구조대상자 정보 표준화 전파' }
                ]
            },
            {
                roleName: '현장지휘대',
                tasks: [
                    { label: '구조 우선순위 검토' },
                    { label: '6층 고립자와 7층 대피 지연자를 분리 판단' }
                ]
            },
            {
                roleName: '선착분대',
                tasks: [
                    { label: '대피 가능 인원과 고립 가능 인원 구분 인지' },
                    { label: '계단실 안전 확인 준비' }
                ]
            },
            {
                roleName: '구조대',
                tasks: [
                    { label: '6층 우선 탐색 계획 정리' },
                    { label: '7층 확인조 운영 가능성 검토' }
                ]
            },
            {
                roleName: '구급대',
                tasks: [
                    { label: '연기흡입 호소자 발생 대비' },
                    { label: '임시 환자분류 지점 후보 구상' }
                ]
            }
        ]
    },
    {
        title: '대상물 내부 동선 및 주출입구 운용 정보 공유',
        description: '대상물 내부 접근은 동측 주출입구 중심. 주출입구 1개소로 차량 및 인원 집중 예상, 내부 규모가 커 방향 상실 및 현장지휘 사각 우려.',
        sub_types: ['건물정보'],
        category: 'phase_2',
        delivery_type: 'instant',
        scheduled_delay_min: 0,
        roles: [
            {
                roleName: '상황실',
                tasks: [
                    { label: '동측 주출입구 1개소 정보 전파' },
                    { label: '내부 규모 및 현장지휘 사각 우려 전파' }
                ]
            },
            {
                roleName: '현장지휘대',
                tasks: [
                    { label: '고정지휘 위치 재검토' },
                    { label: '방면구역 분리 필요성 검토' }
                ]
            },
            {
                roleName: '선착분대',
                tasks: [
                    { label: '단일 진입동선 혼잡 가능성 인지' },
                    { label: '진입 후 퇴로 확보 필요성 인지' }
                ]
            },
            {
                roleName: '구조대',
                tasks: [
                    { label: '내부 방향 상실 위험 인지' },
                    { label: '탐색 시 기준점 설정 준비' }
                ]
            },
            {
                roleName: '후착부대',
                tasks: [
                    { label: '주출입구 혼잡 시 대기 및 부서 조정 준비' }
                ]
            }
        ]
    },
    {
        title: '방재실 확인 및 소방시설 작동 정보 공유',
        description: '방재실 확인 결과 6층 감지기 동작 및 일부 경보 작동 확인. 스프링클러 및 제연설비 작동 여부 추가 확인 중, 승강기 사용 제한 필요.',
        sub_types: ['건물정보', '추가정보'],
        category: 'phase_2',
        delivery_type: 'instant',
        scheduled_delay_min: 0,
        roles: [
            {
                roleName: '상황실',
                tasks: [
                    { label: '방재실 확인 내용 정리' },
                    { label: '감지기·경보 작동 정보 전파' },
                    { label: '스프링클러·제연설비 추가 확인 지시' }
                ]
            },
            {
                roleName: '현장지휘대',
                tasks: [
                    { label: '설비 작동 정보 반영해 초기 전략 검토' },
                    { label: '승강기 사용 제한 필요성 인지' }
                ]
            },
            {
                roleName: '선착분대',
                tasks: [
                    { label: '방재실 정보 기반 현장확인 준비' },
                    { label: '승강기 통제 전제 활동 준비' }
                ]
            },
            {
                roleName: '구조대',
                tasks: [
                    { label: '계단실 중심 접근 준비' },
                    { label: '설비 미작동 가능성 염두에 둔 탐색 준비' }
                ]
            },
            {
                roleName: '통제단 준비요원',
                tasks: [
                    { label: '소방시설 정보 공유 준비' }
                ]
            }
        ]
    },
    {
        title: '출동 중 추가 정보: 배연 곤란 및 패널 구조 위험 재강조',
        description: '내부는 밀폐형 창고 구조로 배연이 곤란하며, 패널 마감 및 다량 가연물 적재로 은폐화염·급격한 연소확대 가능성 높음.',
        sub_types: ['추가정보'],
        category: 'phase_2',
        delivery_type: 'instant',
        scheduled_delay_min: 0,
        roles: [
            {
                roleName: '상황실',
                tasks: [
                    { label: '배연 곤란 정보 재전파' },
                    { label: '패널 구조 및 가연물 적재 정보 재전파' }
                ]
            },
            {
                roleName: '현장지휘대',
                tasks: [
                    { label: '시야 확보 전 무리한 진입 제한 원칙 재확인' },
                    { label: 'TIC 및 배연전략 적용 필요성 검토' }
                ]
            },
            {
                roleName: '선착분대',
                tasks: [
                    { label: '무리한 내부진입 자제 인지' },
                    { label: '열 축적 및 급격한 연소확대 가능성 인지' }
                ]
            },
            {
                roleName: '구조대',
                tasks: [
                    { label: 'TIC 우선 사용 준비' },
                    { label: '고온·저시야 환경 구조 대비' }
                ]
            },
            {
                roleName: '구급대',
                tasks: [
                    { label: '열손상·연기흡입 환자 대응 준비' }
                ]
            }
        ]
    },
    {
        title: '후착 출동대 및 특수차량 현황 공유',
        description: '후착 출동대 및 특수차량 출동 중. 대상 규모상 후착부대 연계가 필요하며, 주출입구 혼잡 방지 및 자원 분산 배치가 요구됨.',
        sub_types: ['상황전파', '추가정보'],
        category: 'phase_2',
        delivery_type: 'instant',
        scheduled_delay_min: 0,
        roles: [
            {
                roleName: '상황실',
                tasks: [
                    { label: '후착 출동대 현황 정리' },
                    { label: '특수차량 접근 가능 여부 확인' },
                    { label: '현장 도착 예상시간 전파' }
                ]
            },
            {
                roleName: '현장지휘대',
                tasks: [
                    { label: '후착 자원 활용 계획 검토' },
                    { label: '현장 도착 직후 부서 조정 계획 수립' }
                ]
            },
            {
                roleName: '선착분대',
                tasks: [
                    { label: '후착대 연계 전제 초기활동 준비' }
                ]
            },
            {
                roleName: '후착부대',
                tasks: [
                    { label: '선착대 보고 수신 준비' },
                    { label: '지휘 지시 전 임의 진입 금지 인지' }
                ]
            },
            {
                roleName: '통제단 준비요원',
                tasks: [
                    { label: '자원 수용 및 배치 준비' }
                ]
            }
        ]
    },
    {
        title: '지휘망 및 공통 통신채널 운용 지시',
        description: '현장상황 보고는 지정 지휘망으로 통일. 관계기관은 공통 통신채널 입장 준비, 불필요한 무전은 최소화.',
        sub_types: ['무전채널운영'],
        category: 'phase_2',
        delivery_type: 'instant',
        scheduled_delay_min: 0,
        roles: [
            {
                roleName: '상황실',
                tasks: [
                    { label: '지휘망 지정' },
                    { label: '공통 통신채널 공유' },
                    { label: '관계기관 채널 입장 준비 확인' }
                ]
            },
            {
                roleName: '현장지휘대',
                tasks: [
                    { label: '핵심보고 위주 무전기준 설정 준비' },
                    { label: '상황보고 우선순위 정리' }
                ]
            },
            {
                roleName: '선착분대',
                tasks: [
                    { label: '최초보고 문안 정리' },
                    { label: '불필요한 무전 자제' }
                ]
            },
            {
                roleName: '구조대',
                tasks: [
                    { label: '탐색·구조상황 핵심보고 기준 숙지' }
                ]
            },
            {
                roleName: '구급대',
                tasks: [
                    { label: '환자 수·중증도 중심 보고 준비' }
                ]
            }
        ]
    },
    {
        title: '선착 직전 1차 상황보고 준비',
        description: '현장 접근 중 전면부에서 6층 연기 다량 확인. 7층 일부 창측에도 연기 체류 관찰. 선착대는 도착 즉시 화점·연기·인명대피 상황을 최초 보고할 것.',
        sub_types: ['상황보고'],
        category: 'phase_2',
        delivery_type: 'instant',
        scheduled_delay_min: 0,
        roles: [
            {
                roleName: '현장지휘대',
                tasks: [
                    { label: '최초 상황보고 핵심항목 정리' },
                    { label: '현장 도착 즉시 지휘권 선언 준비' }
                ]
            },
            {
                roleName: '선착분대',
                tasks: [
                    { label: '화점 위치 확인 준비' },
                    { label: '연기 유동 방향 확인 준비' },
                    { label: '대피 인원 및 고립 우려 확인 준비' }
                ]
            },
            {
                roleName: '구조대',
                tasks: [
                    { label: '현장 도착 즉시 검색 우선구역 재확인 준비' }
                ]
            },
            {
                roleName: '구급대',
                tasks: [
                    { label: '대피자 응급평가 위치 확인 준비' }
                ]
            },
            {
                roleName: '후착부대',
                tasks: [
                    { label: '선착대 최초보고 수신 준비' }
                ]
            }
        ]
    },
    {
        title: '도착 직전 종합상황 재전파 및 공통상황도 형성',
        description: '현재 상황 종합: 6층 주 화점 추정, 7층 연기 유입, 내부 연락 두절자 존재, 단일 주출입구 혼잡 예상, 배연 곤란 및 급격한 연소확대 우려. 전 출동대 공통상황도 형성 유지.',
        sub_types: ['상황전파', '상황보고'],
        category: 'phase_2',
        delivery_type: 'instant',
        scheduled_delay_min: 0,
        roles: [
            {
                roleName: '상황실',
                tasks: [
                    { label: '현재까지 종합상황 일괄 재전파' },
                    { label: '누락 정보 여부 최종 확인' }
                ]
            },
            {
                roleName: '현장지휘대',
                tasks: [
                    { label: '도착 직후 초기지휘 절차 머릿속 정리' },
                    { label: '지휘권 선언·현장확인·최초보고 순서 정리' }
                ]
            },
            {
                roleName: '선착분대',
                tasks: [
                    { label: '공통상황도 기준으로 초기활동 준비' },
                    { label: '현장 도착 후 임의 분산행동 금지 인지' }
                ]
            },
            {
                roleName: '구조대',
                tasks: [
                    { label: '선착대 지휘하 구조 투입 준비' }
                ]
            },
            {
                roleName: '구급대',
                tasks: [
                    { label: '현장 접근 후 구급집결 위치 확인 준비' }
                ]
            },
            {
                roleName: '통제단 준비요원',
                tasks: [
                    { label: '상황 확대 시 통제단 가동 대비' }
                ]
            }
        ]
    }
];
