'use client'

import {
    Box,
    Container,
    Flex,
    Text,
    Image,
} from "@chakra-ui/react"
import { useState } from "react"
import CrowdsourceNav from "../../_components/CrowdsourceNav"
import { useRouter } from 'next/navigation'

export default function AboutUs() {
    const [activeTab, setActiveTab] = useState("关于我们")

    const router = useRouter()

    const sidebarItems = [
        { label: "积分明细", icon: "📊" },
        { label: "设置", icon: "⚙️" },
        { label: "消息中心", icon: "💬" },
        { label: "意见反馈", icon: "📝" },
        { label: "关于我们", icon: "ℹ️" },
    ]

    const handleSidebarClick = (label: string) => {
        setActiveTab(label)
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

                        {/* About Us Content */}
                        <Box bg="white" borderRadius="8px" p={6}>
                            {/* Platform Introduction */}
                            <Box mb={8}>
                                <Text fontSize="18px" fontWeight="500" color="#1D2129" mb={4}>
                                    平台简介
                                </Text>
                                <Text fontSize="14px" color="#4E5969" lineHeight="1.8" mb={2}>
                                    为银行用户声音，精准掌握用户声音，提升用户体验，行内全新推出广发众测平台，打造出"全行众测"模式，涵盖"全行众测"模式，融合"短平快"的
                                </Text>
                                <Text fontSize="14px" color="#4E5969" lineHeight="1.8">
                                    线上测试流程，广发众测平台将建立行内更多新应用投产的选用产品验证改需求，有效提升客户满意度，并逐步建立传统质量、行内众测相辅相成的
                                </Text>
                                <Text fontSize="14px" color="#4E5969" lineHeight="1.8">
                                    立体测试体系。
                                </Text>
                            </Box>

                            {/* Platform Features */}
                            <Box mb={8}>
                                <Text fontSize="18px" fontWeight="500" color="#1D2129" mb={4}>
                                    平台特点
                                </Text>
                                <Text fontSize="14px" color="#4E5969" lineHeight="1.8">
                                    全行众测、因循接受率、操作简单、轻松易上手、全新形制、等你来体验。
                                </Text>
                            </Box>

                            {/* Test Value */}
                            <Box mb={8}>
                                <Text fontSize="18px" fontWeight="500" color="#1D2129" mb={4}>
                                    测试价值
                                </Text>

                                <Text fontSize="14px" color="#4E5969" lineHeight="1.8" mb={3}>
                                    传统测试补充：
                                </Text>
                                <Text fontSize="14px" color="#4E5969" lineHeight="1.8" mb={4}>
                                    "全行众测"模式秘经验建议用户为导向，能在保大规模上帮决研测试中增以解决的"用户使用机型差异"和"不同用户操作习惯差异"等问题;
                                </Text>

                                <Text fontSize="14px" color="#4E5969" lineHeight="1.8" mb={3}>
                                    请听用户声音：
                                </Text>
                                <Text fontSize="14px" color="#4E5969" lineHeight="1.8" mb={4}>
                                    通过鼓励全行员工，特别是全国各分行的一线员工，利用自身"直面客户，对客户需求更更度精准"的优势，对新应用进行实操体验测试，从而收集更
                                </Text>
                                <Text fontSize="14px" color="#4E5969" lineHeight="1.8" mb={4}>
                                    多一线用户对新应用的真实使用感觉和优化建议;
                                </Text>

                                <Text fontSize="14px" color="#4E5969" lineHeight="1.8" mb={3}>
                                    产品质量提升：
                                </Text>
                                <Text fontSize="14px" color="#4E5969" lineHeight="1.8" mb={4}>
                                    新版应用投产前，大规模内部众测，可以有效提升产品在用户端的质量、兼容性、功能等方面的能力，有效提升客户满意度;
                                </Text>

                                <Text fontSize="14px" color="#4E5969" lineHeight="1.8" mb={3}>
                                    有助宣传推广：
                                </Text>
                                <Text fontSize="14px" color="#4E5969" lineHeight="1.8" mb={2}>
                                    众测能帮助业务部门"提前"以测代传"的效果，帮助行资通过完成众测任务，提前掌握新版应用的特性，为后续产品推广了下良好基础。
                                </Text>
                            </Box>

                            {/* Test Product Range */}
                            <Box>
                                <Text fontSize="18px" fontWeight="500" color="#1D2129" mb={4}>
                                    测试产品范围
                                </Text>

                                <Text fontSize="14px" color="#4E5969" lineHeight="1.8" mb={2}>
                                    第一类：系统测试
                                </Text>
                                <Text fontSize="14px" color="#4E5969" lineHeight="1.8" mb={4}>
                                    Android客户端、iOS客户端、手机Web、微信小程序、微信公众号、PC客户端
                                </Text>

                                <Text fontSize="14px" color="#4E5969" lineHeight="1.8" mb={2}>
                                    第二类：服务检测
                                </Text>
                                <Text fontSize="14px" color="#4E5969" lineHeight="1.8">
                                    硬客体验、流程考核、服务质量
                                </Text>
                            </Box>
                        </Box>
                    </Box>
                </Flex>
            </Container>
        </Box>
    )
}
