'use client'

import {
    Box,
    Container,
    Flex,
    Text,
    Button,
    Input,
    Image,
} from "@chakra-ui/react"
import { NativeSelectRoot, NativeSelectField } from "@chakra-ui/react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import CrowdsourceNav from "../../_components/CrowdsourceNav"
import { Switch } from "@/app/_components/ui/switch"
import { api } from "@/trpc/react"
import { toaster } from "@/app/_components/ui/toaster"
import { useSession } from "next-auth/react"

export default function SettingsPage() {
    const router = useRouter()
    const { data: session } = useSession()
    const [activeTab, setActiveTab] = useState("设置")
    const [formData, setFormData] = useState({
        name: "",
        gender: "男",
        ageRange: "20-29岁",
        phone: "",
        phoneModel: "",
        province: "广东省",
        city: "广州市",
        organization: "",
        department: "",
        secondDepartment: "",
        skillTags: [] as string[],
        paymentAccount: "",
    })

    // 获取用户设置
    const { data: userSettings, isLoading } = api.userSettings.get.useQuery()

    // 保存用户设置
    const upsertSettings = api.userSettings.upsert.useMutation({
        onSuccess: () => {
            toaster.create({
                title: "保存成功",
                description: "您的设置已成功保存",
                type: "success",
                duration: 3000,
            })
        },
        onError: (error) => {
            toaster.create({
                title: "保存失败",
                description: error.message || "保存设置时出错",
                type: "error",
                duration: 3000,
            })
        },
    })

    // 当获取到用户设置时,更新表单数据
    useEffect(() => {
        if (userSettings) {
            setFormData({
                name: userSettings.name || "",
                gender: userSettings.gender || "男",
                ageRange: userSettings.ageRange || "20-29岁",
                phone: userSettings.phone || "",
                phoneModel: userSettings.phoneModel || "",
                province: userSettings.province || "广东省",
                city: userSettings.city || "广州市",
                organization: userSettings.organization || "",
                department: userSettings.department || "",
                secondDepartment: userSettings.secondDepartment || "",
                skillTags: userSettings.skillTags || [],
                paymentAccount: userSettings.paymentAccount || "",
            })
            setNotifications({
                blueMessenger: userSettings.blueMessenger ?? true,
                emailNotification: userSettings.emailNotification ?? false,
                wechatNotification: userSettings.wechatNotification ?? false,
            })
        }
    }, [userSettings])

    // 省市数据
    const provinces = [
        { name: "北京市", cities: ["东城区", "西城区", "朝阳区", "丰台区", "石景山区", "海淀区", "门头沟区", "房山区", "通州区", "顺义区", "昌平区", "大兴区", "怀柔区", "平谷区", "密云区", "延庆区"] },
        { name: "天津市", cities: ["和平区", "河东区", "河西区", "南开区", "河北区", "红桥区", "东丽区", "西青区", "津南区", "北辰区", "武清区", "宝坻区", "滨海新区", "宁河区", "静海区", "蓟州区"] },
        { name: "河北省", cities: ["石家庄市", "唐山市", "秦皇岛市", "邯郸市", "邢台市", "保定市", "张家口市", "承德市", "沧州市", "廊坊市", "衡水市"] },
        { name: "山西省", cities: ["太原市", "大同市", "阳泉市", "长治市", "晋城市", "朔州市", "晋中市", "运城市", "忻州市", "临汾市", "吕梁市"] },
        { name: "内蒙古自治区", cities: ["呼和浩特市", "包头市", "乌海市", "赤峰市", "通辽市", "鄂尔多斯市", "呼伦贝尔市", "巴彦淖尔市", "乌兰察布市", "兴安盟", "锡林郭勒盟", "阿拉善盟"] },
        { name: "辽宁省", cities: ["沈阳市", "大连市", "鞍山市", "抚顺市", "本溪市", "丹东市", "锦州市", "营口市", "阜新市", "辽阳市", "盘锦市", "铁岭市", "朝阳市", "葫芦岛市"] },
        { name: "吉林省", cities: ["长春市", "吉林市", "四平市", "辽源市", "通化市", "白山市", "松原市", "白城市", "延边朝鲜族自治州"] },
        { name: "黑龙江省", cities: ["哈尔滨市", "齐齐哈尔市", "鸡西市", "鹤岗市", "双鸭山市", "大庆市", "伊春市", "佳木斯市", "七台河市", "牡丹江市", "黑河市", "绥化市", "大兴安岭地区"] },
        { name: "上海市", cities: ["黄浦区", "徐汇区", "长宁区", "静安区", "普陀区", "虹口区", "杨浦区", "闵行区", "宝山区", "嘉定区", "浦东新区", "金山区", "松江区", "青浦区", "奉贤区", "崇明区"] },
        { name: "江苏省", cities: ["南京市", "无锡市", "徐州市", "常州市", "苏州市", "南通市", "连云港市", "淮安市", "盐城市", "扬州市", "镇江市", "泰州市", "宿迁市"] },
        { name: "浙江省", cities: ["杭州市", "宁波市", "温州市", "嘉兴市", "湖州市", "绍兴市", "金华市", "衢州市", "舟山市", "台州市", "丽水市"] },
        { name: "安徽省", cities: ["合肥市", "芜湖市", "蚌埠市", "淮南市", "马鞍山市", "淮北市", "铜陵市", "安庆市", "黄山市", "滁州市", "阜阳市", "宿州市", "六安市", "亳州市", "池州市", "宣城市"] },
        { name: "福建省", cities: ["福州市", "厦门市", "莆田市", "三明市", "泉州市", "漳州市", "南平市", "龙岩市", "宁德市"] },
        { name: "江西省", cities: ["南昌市", "景德镇市", "萍乡市", "九江市", "新余市", "鹰潭市", "赣州市", "吉安市", "宜春市", "抚州市", "上饶市"] },
        { name: "山东省", cities: ["济南市", "青岛市", "淄博市", "枣庄市", "东营市", "烟台市", "潍坊市", "济宁市", "泰安市", "威海市", "日照市", "临沂市", "德州市", "聊城市", "滨州市", "菏泽市"] },
        { name: "河南省", cities: ["郑州市", "开封市", "洛阳市", "平顶山市", "安阳市", "鹤壁市", "新乡市", "焦作市", "濮阳市", "许昌市", "漯河市", "三门峡市", "南阳市", "商丘市", "信阳市", "周口市", "驻马店市", "济源市"] },
        { name: "湖北省", cities: ["武汉市", "黄石市", "十堰市", "宜昌市", "襄阳市", "鄂州市", "荆门市", "孝感市", "荆州市", "黄冈市", "咸宁市", "随州市", "恩施土家族苗族自治州", "仙桃市", "潜江市", "天门市", "神农架林区"] },
        { name: "湖南省", cities: ["长沙市", "株洲市", "湘潭市", "衡阳市", "邵阳市", "岳阳市", "常德市", "张家界市", "益阳市", "郴州市", "永州市", "怀化市", "娄底市", "湘西土家族苗族自治州"] },
        { name: "广东省", cities: ["广州市", "韶关市", "深圳市", "珠海市", "汕头市", "佛山市", "江门市", "湛江市", "茂名市", "肇庆市", "惠州市", "梅州市", "汕尾市", "河源市", "阳江市", "清远市", "东莞市", "中山市", "潮州市", "揭阳市", "云浮市"] },
        { name: "广西壮族自治区", cities: ["南宁市", "柳州市", "桂林市", "梧州市", "北海市", "防城港市", "钦州市", "贵港市", "玉林市", "百色市", "贺州市", "河池市", "来宾市", "崇左市"] },
        { name: "海南省", cities: ["海口市", "三亚市", "三沙市", "儋州市", "五指山市", "琼海市", "文昌市", "万宁市", "东方市", "定安县", "屯昌县", "澄迈县", "临高县", "白沙黎族自治县", "昌江黎族自治县", "乐东黎族自治县", "陵水黎族自治县", "保亭黎族苗族自治县", "琼中黎族苗族自治县"] },
        { name: "重庆市", cities: ["万州区", "涪陵区", "渝中区", "大渡口区", "江北区", "沙坪坝区", "九龙坡区", "南岸区", "北碚区", "綦江区", "大足区", "渝北区", "巴南区", "黔江区", "长寿区", "江津区", "合川区", "永川区", "南川区", "璧山区", "铜梁区", "潼南区", "荣昌区", "开州区", "梁平区", "武隆区", "城口县", "丰都县", "垫江县", "忠县", "云阳县", "奉节县", "巫山县", "巫溪县", "石柱土家族自治县", "秀山土家族苗族自治县", "酉阳土家族苗族自治县", "彭水苗族土家族自治县"] },
        { name: "四川省", cities: ["成都市", "自贡市", "攀枝花市", "泸州市", "德阳市", "绵阳市", "广元市", "遂宁市", "内江市", "乐山市", "南充市", "眉山市", "宜宾市", "广安市", "达州市", "雅安市", "巴中市", "资阳市", "阿坝藏族羌族自治州", "甘孜藏族自治州", "凉山彝族自治州"] },
        { name: "贵州省", cities: ["贵阳市", "六盘水市", "遵义市", "安顺市", "毕节市", "铜仁市", "黔西南布依族苗族自治州", "黔东南苗族侗族自治州", "黔南布依族苗族自治州"] },
        { name: "云南省", cities: ["昆明市", "曲靖市", "玉溪市", "保山市", "昭通市", "丽江市", "普洱市", "临沧市", "楚雄彝族自治州", "红河哈尼族彝族自治州", "文山壮族苗族自治州", "西双版纳傣族自治州", "大理白族自治州", "德宏傣族景颇族自治州", "怒江傈僳族自治州", "迪庆藏族自治州"] },
        { name: "西藏自治区", cities: ["拉萨市", "日喀则市", "昌都市", "林芝市", "山南市", "那曲市", "阿里地区"] },
        { name: "陕西省", cities: ["西安市", "铜川市", "宝鸡市", "咸阳市", "渭南市", "延安市", "汉中市", "榆林市", "安康市", "商洛市"] },
        { name: "甘肃省", cities: ["兰州市", "嘉峪关市", "金昌市", "白银市", "天水市", "武威市", "张掖市", "平凉市", "酒泉市", "庆阳市", "定西市", "陇南市", "临夏回族自治州", "甘南藏族自治州"] },
        { name: "青海省", cities: ["西宁市", "海东市", "海北藏族自治州", "黄南藏族自治州", "海南藏族自治州", "果洛藏族自治州", "玉树藏族自治州", "海西蒙古族藏族自治州"] },
        { name: "宁夏回族自治区", cities: ["银川市", "石嘴山市", "吴忠市", "固原市", "中卫市"] },
        { name: "新疆维吾尔自治区", cities: ["乌鲁木齐市", "克拉玛依市", "吐鲁番市", "哈密市", "昌吉回族自治州", "博尔塔拉蒙古自治州", "巴音郭楞蒙古自治州", "阿克苏地区", "克孜勒苏柯尔克孜自治州", "喀什地区", "和田地区", "伊犁哈萨克自治州", "塔城地区", "阿勒泰地区", "石河子市", "阿拉尔市", "图木舒克市", "五家渠市", "北屯市", "铁门关市", "双河市", "可克达拉市", "昆玉市", "胡杨河市", "新星市", "白杨市"] },
        { name: "台湾省", cities: ["台北市", "新北市", "桃园市", "台中市", "台南市", "高雄市", "基隆市", "新竹市", "嘉义市", "新竹县", "苗栗县", "彰化县", "南投县", "云林县", "嘉义县", "屏东县", "宜兰县", "花莲县", "台东县", "澎湖县", "金门县", "连江县"] },
        { name: "香港特别行政区", cities: ["中西区", "湾仔区", "东区", "南区", "油尖旺区", "深水埗区", "九龙城区", "黄大仙区", "观塘区", "荃湾区", "屯门区", "元朗区", "北区", "大埔区", "沙田区", "西贡区", "葵青区", "离岛区"] },
        { name: "澳门特别行政区", cities: ["花地玛堂区", "圣安多尼堂区", "大堂区", "望德堂区", "风顺堂区", "嘉模堂区", "路氹城"] }
    ]

    const currentProvince = provinces.find(p => p.name === formData.province)
    const cities = currentProvince ? currentProvince.cities : []

    const [notifications, setNotifications] = useState({
        blueMessenger: true,
        emailNotification: false,
        wechatNotification: false,
    })

    const sidebarItems = [
        { label: "积分明细", icon: "📊" },
        { label: "设置", icon: "⚙️" },
        { label: "消息中心", icon: "💬" },
        { label: "意见反馈", icon: "📝" },
        { label: "关于我们", icon: "ℹ️" },
    ]

    const handleRemoveTag = (index: number) => {
        const newTags = formData.skillTags.filter((_, i) => i !== index)
        setFormData({ ...formData, skillTags: newTags })
    }

    const handleSidebarClick = (label: string) => {
        setActiveTab(label)

        // 跳转对应页面逻辑
        if (label === "积分明细") {
            router.push('/crowdsource/pointsDetails')
        } else if (label === "设置") {
            router.push('/crowdsource/settings')
        } else if (label === "消息中心") {
            router.push('/crowdsource/messageCenter')
        } else if (label === "意见反馈") {
            router.push('/crowdsource/feedback')
        } else if (label === "关于我们") {
            router.push('/crowdsource/aboutUs')
        }
    }

    // 保存设置
    const handleSave = () => {
        upsertSettings.mutate({
            name: formData.name,
            gender: formData.gender,
            ageRange: formData.ageRange,
            phoneModel: formData.phoneModel,
            province: formData.province,
            city: formData.city,
            organization: formData.organization,
            department: formData.department,
            secondDepartment: formData.secondDepartment,
            skillTags: formData.skillTags,
            blueMessenger: notifications.blueMessenger,
            emailNotification: notifications.emailNotification,
            wechatNotification: notifications.wechatNotification,
        })
    }

    return (
        <Box minH="100vh" bg="#F3F7FB">
            <CrowdsourceNav />

            <Container maxW="1400px" pt="80px" pb={6}>
                <Flex gap={6} align="flex-start">
                    {/* Left Sidebar */}
                    <Box
                        w="260px"
                        bg="white"
                        borderRadius="8px"
                        p={4}
                        flexShrink={0}
                    >
                        <Flex align="center" mb={4} pb={4} borderBottom="1px solid #F2F3F5">
                            <Box>
                                <Image
                                    src="/images/task-hall/avatar-big.png"
                                    alt="用户头像"
                                    w="48px"
                                    h="48px"
                                    borderRadius="50%"
                                    objectFit="cover"
                                />
                            </Box>
                            <Box ml={3}>
                                <Text fontSize="16px" fontWeight="500" color="#1D2129">
                                    个人中心
                                </Text>
                            </Box>
                        </Flex>

                        <Box>
                            {sidebarItems.map((item) => (
                                <Box
                                    key={item.label}
                                    px={3}
                                    py={2}
                                    mb={1}
                                    borderRadius="4px"
                                    bg={activeTab === item.label ? "#FEDFE1" : "transparent"}
                                    color={activeTab === item.label ? "#FE606B" : "#4E5969"}
                                    cursor="pointer"
                                    _hover={{ bg: activeTab === item.label ? "#FEDFE1" : "#F7F8FA" }}
                                    onClick={() => handleSidebarClick(item.label)}
                                >
                                    <Flex align="center">
                                        <Text fontSize="16px" mr={2}>{item.icon}</Text>
                                        <Text fontSize="14px" fontWeight={activeTab === item.label ? "500" : "400"}>
                                            {item.label}
                                        </Text>
                                    </Flex>
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Right Content Area */}
                    <Box flex={1}>
                        {/* Breadcrumb */}
                        <Flex align="center" mb={4} fontSize="14px" color="#86909C">
                            <Text cursor="pointer" _hover={{ color: "#1D2129" }}>个人中心</Text>
                            <Text mx={2}>/</Text>
                            <Text color="#1D2129">{activeTab}</Text>
                        </Flex>

                        {/* Settings Content */}
                        <Box bg="white" borderRadius="8px" p={6}>
                            {isLoading ? (
                                <Flex justify="center" align="center" minH="400px">
                                    <Text color="#86909C">加载中...</Text>
                                </Flex>
                            ) : (
                                <>
                                    {/* Personal Information Section */}
                                    <Box mb={8} pb={8} borderBottom="1px solid #F2F3F5">
                                        <Text fontSize="16px" fontWeight="500" color="#1D2129" mb={4}>
                                            个人信息
                                        </Text>

                                        {/* Form Fields */}
                                        <Box w={520}>
                                            {/* Name */}
                                            <Flex align="center" mb={4}>
                                                <Text w="120px" fontSize="14px" color="#4E5969">
                                                    姓名
                                                </Text>
                                                <Input
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    size="md"
                                                    w="400px"
                                                    bg="#F7F8FA"
                                                    border="none"
                                                    borderRadius="4px"
                                                    fontSize="14px"
                                                    _focus={{ bg: "#F7F8FA" }}
                                                />
                                            </Flex>

                                            {/* Gender */}
                                            <Flex align="center" mb={4}>
                                                <Text w="120px" fontSize="14px" color="#4E5969">
                                                    性别
                                                </Text>
                                                <NativeSelectRoot size="md" w="400px">
                                                    <NativeSelectField
                                                        value={formData.gender}
                                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                                        bg="#F7F8FA"
                                                        border="none"
                                                        borderRadius="4px"
                                                        fontSize="14px"
                                                        color="#1D2129"
                                                    >
                                                        <option value="男">男</option>
                                                        <option value="女">女</option>
                                                    </NativeSelectField>
                                                </NativeSelectRoot>
                                            </Flex>

                                            {/* Age Range */}
                                            <Flex align="center" mb={4}>
                                                <Text w="120px" fontSize="14px" color="#4E5969">
                                                    年龄段
                                                </Text>
                                                <NativeSelectRoot size="md" w="400px">
                                                    <NativeSelectField
                                                        value={formData.ageRange}
                                                        onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                                                        bg="#F7F8FA"
                                                        border="none"
                                                        borderRadius="4px"
                                                        fontSize="14px"
                                                        color="#1D2129"
                                                    >
                                                        <option value="20-29岁">20-29岁</option>
                                                        <option value="30-39岁">30-39岁</option>
                                                        <option value="40-49岁">40-49岁</option>
                                                        <option value="50岁以上">50岁以上</option>
                                                    </NativeSelectField>
                                                </NativeSelectRoot>
                                            </Flex>

                                            {/* Phone */}
                                            <Flex align="center" mb={4}>
                                                <Text w="120px" fontSize="14px" color="#4E5969">
                                                    手机号码
                                                </Text>
                                                <Box flex={1}>
                                                    <Input
                                                        value={formData.phone}
                                                        readOnly
                                                        size="md"
                                                        w="400px"
                                                        bg="#EBEEF2"
                                                        border="none"
                                                        borderRadius="4px"
                                                        fontSize="14px"
                                                        color="#86909C"
                                                        cursor="not-allowed"
                                                    />
                                                </Box>
                                            </Flex>

                                            {/* Phone Model */}
                                            <Flex align="center" mb={20}>
                                                <Text w="120px" fontSize="14px" color="#4E5969">
                                                    手机品牌、型号
                                                </Text>
                                                <Input
                                                    value={formData.phoneModel}
                                                    onChange={(e) => setFormData({ ...formData, phoneModel: e.target.value })}
                                                    size="md"
                                                    w="400px"
                                                    bg="#F7F8FA"
                                                    border="none"
                                                    borderRadius="4px"
                                                    fontSize="14px"
                                                    _focus={{ bg: "#F7F8FA" }}
                                                />
                                            </Flex>

                                            {/* Location */}
                                            <Flex align="center" mb={4}>
                                                <Text w="120px" fontSize="14px" color="#4E5969">
                                                    所属地区、位置
                                                </Text>
                                                <Flex gap={2}>
                                                    <NativeSelectRoot size="md" w="195px">
                                                        <NativeSelectField
                                                            value={formData.province}
                                                            onChange={(e) => {
                                                                const newProvince = e.target.value
                                                                const province = provinces.find(p => p.name === newProvince)
                                                                setFormData({
                                                                    ...formData,
                                                                    province: newProvince,
                                                                    city: province?.cities[0] || ""
                                                                })
                                                            }}
                                                            bg="#F7F8FA"
                                                            border="none"
                                                            borderRadius="4px"
                                                            fontSize="14px"
                                                            color="#1D2129"
                                                        >
                                                            {provinces.map(province => (
                                                                <option key={province.name} value={province.name}>
                                                                    {province.name}
                                                                </option>
                                                            ))}
                                                        </NativeSelectField>
                                                    </NativeSelectRoot>
                                                    <NativeSelectRoot size="md" w="195px">
                                                        <NativeSelectField
                                                            value={formData.city}
                                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                            bg="#F7F8FA"
                                                            border="none"
                                                            borderRadius="4px"
                                                            fontSize="14px"
                                                            color="#1D2129"
                                                        >
                                                            {cities.map(city => (
                                                                <option key={city} value={city}>
                                                                    {city}
                                                                </option>
                                                            ))}
                                                        </NativeSelectField>
                                                    </NativeSelectRoot>
                                                </Flex>
                                            </Flex>

                                            {/* Organization */}
                                            <Flex align="center" mb={4}>
                                                <Text w="120px" fontSize="14px" color="#4E5969">
                                                    机构
                                                </Text>
                                                <Input
                                                    value={formData.organization}
                                                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                                    size="md"
                                                    w="400px"
                                                    bg="#F7F8FA"
                                                    border="none"
                                                    borderRadius="4px"
                                                    fontSize="14px"
                                                    _focus={{ bg: "#F7F8FA" }}
                                                />
                                            </Flex>

                                            {/* Department */}
                                            <Flex align="center" mb={4}>
                                                <Text w="120px" fontSize="14px" color="#4E5969">
                                                    部门
                                                </Text>
                                                <Input
                                                    value={formData.department}
                                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                                    size="md"
                                                    w="400px"
                                                    bg="#F7F8FA"
                                                    border="none"
                                                    borderRadius="4px"
                                                    fontSize="14px"
                                                    _focus={{ bg: "#F7F8FA" }}
                                                />
                                            </Flex>

                                            {/* Second Department */}
                                            <Flex align="center" mb={4}>
                                                <Text w="120px" fontSize="14px" color="#4E5969">
                                                    二级部门
                                                </Text>
                                                <Input
                                                    value={formData.secondDepartment}
                                                    onChange={(e) => setFormData({ ...formData, secondDepartment: e.target.value })}
                                                    size="md"
                                                    w="400px"
                                                    bg="#F7F8FA"
                                                    border="none"
                                                    borderRadius="4px"
                                                    fontSize="14px"
                                                    _focus={{ bg: "#F7F8FA" }}
                                                />
                                            </Flex>

                                            {/* Skill Tags */}
                                            <Flex align="flex-start" mb={4}>
                                                <Text w="120px" fontSize="14px" color="#4E5969" pt={2}>
                                                    擅长专业
                                                </Text>
                                                <Box flex={1}>
                                                    <NativeSelectRoot size="md" w="400px" mb={2}>
                                                        <NativeSelectField
                                                            bg="#F7F8FA"
                                                            border="none"
                                                            borderRadius="4px"
                                                            fontSize="14px"
                                                            color="#86909C"
                                                            onChange={(e) => {
                                                                const value = e.target.value
                                                                if (value && !formData.skillTags.includes(value)) {
                                                                    setFormData({ ...formData, skillTags: [...formData.skillTags, value] })
                                                                }
                                                                e.target.value = ""
                                                            }}
                                                        >
                                                            <option value="">请选择</option>
                                                            <option value="公司金融">公司金融</option>
                                                            <option value="个人金融">个人金融</option>
                                                        </NativeSelectField>
                                                    </NativeSelectRoot>
                                                    <Flex gap={2} flexWrap="wrap">
                                                        {formData.skillTags.map((tag, index) => (
                                                            <Flex
                                                                key={index}
                                                                align="center"
                                                                bg="#F7F8FA"
                                                                px={3}
                                                                py={1}
                                                                borderRadius="4px"
                                                                fontSize="14px"
                                                                color="#1D2129"
                                                            >
                                                                <Text>{tag}</Text>
                                                                <Text
                                                                    ml={2}
                                                                    cursor="pointer"
                                                                    color="#86909C"
                                                                    _hover={{ color: "#F53F3F" }}
                                                                    onClick={() => handleRemoveTag(index)}
                                                                >
                                                                    ✕
                                                                </Text>
                                                            </Flex>
                                                        ))}
                                                    </Flex>
                                                </Box>
                                            </Flex>

                                            {/* Save Button */}
                                            <Flex justify="flex-end" mt={6}>
                                                <Button
                                                    bg="linear-gradient(90deg, #FF9266 0%, #FE626B 100%)"
                                                    color="white"
                                                    borderRadius="999px"
                                                    px={8}
                                                    h="36px"
                                                    fontSize="14px"
                                                    fontWeight="400"
                                                    _hover={{ opacity: 0.9 }}
                                                    onClick={handleSave}
                                                    loading={upsertSettings.isPending}
                                                >
                                                    保存
                                                </Button>
                                            </Flex>
                                        </Box>
                                    </Box>

                                    {/* Notification Section */}
                                    <Box mb={8} pb={8} borderBottom="1px solid #F2F3F5">
                                        <Text fontSize="16px" fontWeight="500" color="#1D2129" mb={4}>
                                            通知
                                        </Text>

                                        <Box>
                                            {/* Blue Messenger */}
                                            <Flex align="center" gap={70} mb={4}>
                                                <Text fontSize="14px" color="#4E5969">
                                                    蓝信通知
                                                </Text>
                                                <Flex align="center" gap={2}>
                                                    <Switch
                                                        checked={notifications.blueMessenger}
                                                        onCheckedChange={(e) =>
                                                            setNotifications({ ...notifications, blueMessenger: e.checked })
                                                        }
                                                        colorPalette="red"
                                                    />
                                                    <Text fontSize="14px" color="#86909C">
                                                        {notifications.blueMessenger ? "开启" : "关闭"}
                                                    </Text>
                                                </Flex>
                                            </Flex>

                                            {/* Email Notification */}
                                            <Flex align="center" gap={70} mb={4}>
                                                <Text fontSize="14px" color="#4E5969">
                                                    邮件通知
                                                </Text>
                                                <Flex align="center" gap={2}>
                                                    <Switch
                                                        checked={notifications.emailNotification}
                                                        onCheckedChange={(e) =>
                                                            setNotifications({ ...notifications, emailNotification: e.checked })
                                                        }
                                                        colorPalette="red"
                                                    />
                                                    <Text fontSize="14px" color="#86909C">
                                                        {notifications.emailNotification ? "开启" : "关闭"}
                                                    </Text>
                                                </Flex>
                                            </Flex>

                                            {/* WeChat Notification */}
                                            <Flex align="center" gap={7}>
                                                <Text fontSize="14px" color="#4E5969">
                                                    微信小程序通知
                                                </Text>
                                                <Flex align="center" gap={2}>
                                                    <Switch
                                                        checked={notifications.wechatNotification}
                                                        onCheckedChange={(e) =>
                                                            setNotifications({ ...notifications, wechatNotification: e.checked })
                                                        }
                                                        colorPalette="red"
                                                    />
                                                    <Text fontSize="14px" color="#86909C">
                                                        {notifications.wechatNotification ? "开启" : "关闭"}
                                                    </Text>
                                                </Flex>
                                            </Flex>
                                        </Box>
                                    </Box>

                                    {/* Payment Information Section */}
                                    <Box>
                                        <Text fontSize="16px" fontWeight="500" color="#1D2129" mb={4}>
                                            登记信息
                                        </Text>

                                        <Flex align="center">
                                            <Text w="120px" fontSize="14px" color="#4E5969">
                                                支付宝
                                            </Text>
                                            <Input
                                                value={formData.paymentAccount}
                                                readOnly
                                                size="md"
                                                w="400px"
                                                bg="#EBEEF2"
                                                border="none"
                                                borderRadius="4px"
                                                fontSize="14px"
                                                color="#86909C"
                                                cursor="not-allowed"
                                            />
                                        </Flex>
                                    </Box>
                                </>
                            )}
                        </Box>
                    </Box>
                </Flex>
            </Container>
        </Box>
    )
}
