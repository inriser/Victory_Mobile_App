import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, Modal, TextInput, Alert } from "react-native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiUrl } from "../utils/apiUrl";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";

import TopHeader from "../components/TopHeader";
import BottomTabBar from "../components/BottomTabBar";
import DonutChart from "../components/DonutChart";
import KycChart from "../components/KycChart";

/* Profile Assets */
import Profile from "../../assets/Profile.png";
import ProfileImg1 from "../../assets/ProfileImg1.png";
import ProfilePencil from "../../assets/ProfilePencil.png";

/* Stats Assets */
import Troffy from "../../assets/troffy.png";
import Rewards from "../../assets/rewards.png";
import Book from "../../assets/book.png";

/* Badge Assets */
import BadgeShield from "../../assets/badge_shield.png";
import BadgeStar from "../../assets/badge_star.png";
import BadgeVerified from "../../assets/badge_verified.png";
import BadgeInfluencer from "../../assets/badge_influencer.png";

/* KYC Assets */
import Attach from "../../assets/attach.png";
import Calendar from "../../assets/calendar.png";
import KycIcon from "../../assets/kyc.png";
import DeleteIcon from "../../assets/deleteicon.png";
import ProfileRefresh from "../../assets/profilerefresh.png";
import GrowIcon from "../../assets/grow.png";
import Setting from "../../assets/profilesetting.png";
import LinkedAccount from "../../assets/linkedaccount.png";
import AccountPrivacy from "../../assets/accountprivacy.png";
import ArrowDown from "../../assets/arrow_down.png";
import ArrowUp from "../../assets/arrow_up.png";

const ProfileScreen = () => {

    const [kycOpen, setKycOpen] = useState(false);
    const [setting, setSetting] = useState(false);
    const [linkedAccount, setLinkedAccount] = useState(false);
    const [accountPrivacy, setAccountPrivacy] = useState(false);
    const navigation = useNavigation();
    const { authToken, clientId, clearAuth } = useAuth();
    const [portfolioData, setPortfolioData] = useState([]);
    const [totalCurrent, setTotalCurrent] = useState("0.00");
    const [totalProfit, setTotalProfit] = useState("0.00");
    const [totalInvested, setTotalInvested] = useState("0.00");
    const [profitVal, setProfitVal] = useState("0.00");
    const [profitPercentage, setProfitPercentage] = useState("0.00");
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [mobile, setMobile] = useState("");
    const [email, setEmail] = useState("");
    const [profileImage, setProfileImage] = useState(null);
    const [editOpen, setEditOpen] = useState(false);

    const [editName, setEditName] = useState("");
    const [editUsername, setEditUsername] = useState("");
    const [editMobile, setEditMobile] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editImage, setEditImage] = useState(null);
    const openEditProfile = () => {
        setEditName(name);
        setEditUsername(username);
        setEditMobile(mobile);
        setEditEmail(email);
        setEditImage(profileImage);
        setEditOpen(true);
    };
    const uriToBase64 = async (uri) => {
        const response = await fetch(uri);
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                // remove data:image/...;base64,
                const base64data = reader.result.split(",")[1];
                resolve(base64data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };
    const getImageSource = (img) => {
        if (!img) return Profile;

        // agar file uri hai
        if (img.startsWith("file://") || img.startsWith("content://")) {
            return { uri: img };
        }

        // agar base64 hai
        return { uri: `data:image/jpeg;base64,${img}` };
    };
    const handleSaveProfile = async () => {
        try {
            let imageBase64 = null;

            // Agar image change hui hai tabhi base64 banao
            if (editImage && editImage !== profileImage) {
                imageBase64 = await uriToBase64(editImage);
            }

            const payload = {
                name: editName,
                username: editUsername,
                phone: editMobile,
                email: editEmail,
                image: imageBase64, // base64 string
            };

            console.log("UPDATE PROFILE PAYLOAD =>", payload);
            const userId = await AsyncStorage.getItem("userId");
            await axios.put(`${apiUrl}/api/users/users/${userId}`, payload);
            setEditOpen(false);
            getUserById();
        } catch (err) {
            console.log("Save profile error =>", err);
        }
    };

    const formatAmount = (num) => {
        if (!num) return "0";
        return Number(num).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };
    const getUserById = async () => {
        try {
            const userId = await AsyncStorage.getItem("userId");
            const res = await axios.get(`${apiUrl}/api/users/${userId}`);

            const user = res.data.data;
            setName(user.name || "");
            setUsername(user.username || "");
            setMobile(user.phone || "");
            setEmail(user.email || "");
            setProfileImage(user.userimage || null);

        } catch (err) {
            console.log("API Error =>", err);
        }
    };

    const fetchPortfolioBalance = async () => {
        try {
            const res = await fetch(`${apiUrl}/api/portfolio/getPortfolioBalance`);
            const json = await res.json();

            if (json.success) {
                let totalCurrentValue = 0;
                let totalProfitValue = 0;
                let totalInvestedValue = 0;

                const processed = json.data.map(item => {

                    const realisedQty = Number(item.realisedquantity) || 0;
                    const ltp = Number(item.ltp) || 0;
                    const avg = Number(item.averageprice) || 0;

                    // invested value
                    const invested = avg * realisedQty;

                    // current value (Correct: LTP × Qty)
                    const currentValue = ltp * realisedQty;

                    // profit
                    const profit = currentValue - invested;

                    // profit %
                    const profitPercent =
                        invested > 0
                            ? ((profit / invested) * 100).toFixed(2)
                            : "0.00";


                    totalCurrentValue += currentValue;
                    totalProfitValue += profit;
                    totalInvestedValue += invested;

                    return {
                        ...item,
                        invested: invested.toFixed(2),
                        currentValue: currentValue.toFixed(2),
                        profit: profit.toFixed(2),
                        profitPercent
                    };
                });

                setPortfolioData(processed);
                setTotalProfit(totalProfitValue.toFixed(2));
                setTotalCurrent(totalCurrentValue.toFixed(2));
                setTotalInvested(totalInvestedValue.toFixed(2));

                // overall %
                const overallPercent =
                    totalInvestedValue > 0
                        ? ((totalProfitValue / totalInvestedValue) * 100).toFixed(2)
                        : "0.00";

                setProfitPercentage(overallPercent);
            }

        } catch (err) {
            console.log("API Error:", err);
        }
    };
    const profitColor = Number(totalProfit) >= 0 ? "#1CA95A" : "#D62828";
    const percentColor = Number(profitPercentage) >= 0 ? "#1CA95A" : "#D62828";
    const profitDisplay = `₹${formatAmount(Math.abs(totalProfit))}`;
    const percentDisplay = `${Math.abs(profitPercentage)}%`;
    const pickImage = async () => {
        const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            Alert.alert("Permission required");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setEditImage(result.assets[0].uri);
        }
    };

    useEffect(() => {
        fetchPortfolioBalance();
        getUserById();
    }, []);

    const handleLogout = async () => {
        try {
            // STEP 1: Values load karo
            const userIdStored = await AsyncStorage.getItem("userId");
            const authTokenStored = await AsyncStorage.getItem("authToken");
            const clientIdStored = await AsyncStorage.getItem("clientId");

            if (!userIdStored || !authTokenStored || !clientIdStored) {
                await clearAuth();
                navigation.reset({ index: 0, routes: [{ name: "Login" }] });
                return;
            }

            // STEP 2: API CALL
            const res = await fetch(`${apiUrl}/api/check-user/logout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: userIdStored,
                    authToken: authTokenStored,
                    clientcode: clientIdStored,
                }),
            });

            const data = await res.json();

            // STEP 3: Logout success
            if (data.status) {
                await clearAuth();
                navigation.reset({
                    index: 0,
                    routes: [{ name: "Login" }],
                });
            }

        } catch (err) {
            console.log("Logout Failed:", err);
        }
    };


    return (
        <>
            <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
                <TopHeader />
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {/* PROFILE CARD */}
                    <View style={styles.profileCard}>

                        <View style={styles.topRow}>
                            <Image source={getImageSource(profileImage)} style={styles.profileImage} />

                            <View style={{ marginLeft: 12, }}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.nameText}>{name}</Text>

                                    <TouchableOpacity style={styles.docIcon}>
                                        <Image source={ProfileImg1} style={{ width: 16, height: 16 }} />
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.username}>@{username}</Text>
                                <Text style={styles.contact}>{mobile}</Text>
                                <Text style={styles.contact}>{email}</Text>
                                <Text style={styles.location}>Noida, India</Text>
                            </View>

                            <TouchableOpacity style={styles.editBtn} onPress={openEditProfile}>
                                <Image source={ProfilePencil} style={{ width: 30, height: 30 }} />
                            </TouchableOpacity>
                        </View>

                        {/* PLAN ROW */}
                        {/* <View style={styles.planRow}>
                            <View>
                                <Text style={styles.planLabel}>Premium Plan</Text>
                                <Text style={styles.planStatus}>Active</Text>
                            </View>

                            <View>
                                <Text style={styles.dateLabel}>End Date- 10 Nov 26</Text>
                            </View>

                            <TouchableOpacity style={styles.planBtn}>
                                <Text style={styles.planBtnText}>Manage Plan</Text>
                            </TouchableOpacity>
                        </View> */}
                    </View>


                    {/* PORTFOLIO CARD */}
                    <View style={styles.portfolioMainCard}>
                        <View>
                            <Text style={styles.cardTitle}>Portfolio Value</Text>

                            <Text style={styles.bigAmount}>
                                ₹ {formatAmount(totalCurrent)}

                                {/* PROFIT AMOUNT CLEAN FORMAT */}
                                <Text style={{ color: profitColor, fontWeight: "700", fontSize: 10 }}>
                                    {" "}({profitDisplay})
                                </Text>

                                {/* PROFIT PERCENT CLEAN FORMAT */}
                                <Text style={{ color: percentColor, fontWeight: "700", fontSize: 10 }}>
                                    {" "}({percentDisplay})
                                </Text>
                            </Text>


                            {/* <Text style={styles.greenGain}>
                                {" "} (₹{formatAmount(totalProfit)}) ({profitPercentage}%)
                            </Text> */}

                            <View style={{ marginTop: 12 }}>
                                <View style={styles.listRow}>
                                    <View style={[styles.dot, { backgroundColor: "#210F47" }]} />
                                    <Text style={styles.listText}>Equity</Text>
                                    <Text style={styles.listAmount}>₹{formatAmount(totalInvested)}</Text>
                                </View>

                                {/* <View style={styles.listRow}>
                                    <View style={[styles.dot, { backgroundColor: "#22C55E" }]} />
                                    <Text style={styles.listText}>Mutual Funds</Text>
                                    <Text style={styles.listAmount}>₹45,000</Text>
                                </View>

                                <View style={styles.listRow}>
                                    <View style={[styles.dot, { backgroundColor: "#D32F2F" }]} />
                                    <Text style={styles.listText}>Deposits</Text>
                                    <Text style={styles.listAmount}>₹15,000</Text>
                                </View>

                                <View style={styles.listRow}>
                                    <View style={[styles.dot, { backgroundColor: "#FF9F3F" }]} />
                                    <Text style={styles.listText}>ETF</Text>
                                    <Text style={styles.listAmount}>₹10,000</Text>
                                </View> */}
                            </View>
                        </View>

                        <View style={{ alignItems: "center", width: 140 }}>
                            <Text style={styles.cardTitleRight}>Invested Value</Text>
                            <Text style={styles.investedAmount}>₹ {formatAmount(totalInvested)}</Text>
                            {/* <View style={{ alignItems: "center", width: 140 }}>
                                <DonutChart />
                            </View> */}

                        </View>

                    </View>


                    {/* 3 STATS CARDS */}
                    {/* <View style={styles.statsRow}>

                        <View style={styles.statsCard}>
                            <Image source={Troffy} style={styles.statsIcon} />
                            <Text style={styles.statsTitle}>
                                Active Affiliate <Text style={styles.statsValue}>7</Text>
                            </Text>
                            <Text style={styles.statsCode}>Code VIP2045</Text>
                        </View>

                        <View style={styles.statsCard}>
                            <Image source={Rewards} style={styles.statsIcon} />
                            <Text style={styles.statsTitle}>Total Rewards</Text>
                            <Text style={styles.statsValue}>2,450</Text>
                        </View>

                        <View style={styles.statsCard}>
                            <Image source={Book} style={styles.statsIcon} />
                            <Text style={styles.statsTitle}>Money Balance</Text>
                            <Text style={styles.statsValue}>₹12,450</Text>
                        </View>

                    </View> */}


                    {/* BADGES SECTION */}
                    {/* <View style={styles.badgesSection}>
                        <Text style={styles.badgesTitle}>Badges</Text>

                        <View style={styles.badgeRow}>
                            <View style={{ alignItems: "center" }}>
                                <View style={styles.badgeCard}>
                                    <View style={styles.badgeInnerRow}>
                                        <Text style={styles.badgeCount}>23</Text>
                                        <Image source={BadgeShield} style={styles.badgeIcon} />
                                    </View>
                                </View>
                                <Text style={styles.badgeLabel}>Pro Trader</Text>
                            </View>


                            <View style={{ alignItems: "center" }}>
                                <View style={styles.badgeCard}>
                                    <View style={styles.badgeInnerRow}>
                                        <Text style={styles.badgeCount}>35</Text>
                                        <Image source={BadgeStar} style={styles.badgeIcon} />
                                    </View>
                                </View>
                                <Text style={styles.badgeLabel}>Social Star</Text>
                            </View>

                            <View>
                                <View style={styles.badgeInactive}>
                                    <Image source={BadgeVerified} style={styles.badgeIconInactive} />
                                </View>
                                <Text style={styles.badgeLabel}>Verified</Text>
                            </View>
                            <View>
                                <View style={styles.badgeInactive}>
                                    <Image source={BadgeInfluencer} style={styles.badgeIconInactive} />
                                </View>
                                <Text style={styles.badgeLabel}>Influencer</Text>
                            </View>
                        </View>
                    </View> */}

                    {/* KYC COLLAPSIBLE */}
                    <TouchableOpacity style={kycOpen ? styles.kycHeader : styles.kycHeaderclosed} onPress={() => setKycOpen(!kycOpen)}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Image source={KycIcon} style={{ width: 30, height: 30, marginRight: 8, }} />
                            <Text style={styles.kycTitle}>KYC Verification&nbsp;&nbsp;&nbsp;</Text><KycChart />
                            {/* <Text style={styles.kycPercent}>20%</Text> */}
                        </View>

                        <Image source={kycOpen ? ArrowUp : ArrowDown} style={{ width: 15, height: 8 }} />
                    </TouchableOpacity>

                    {kycOpen && (
                        <View style={styles.kycBody}>
                            {/* Gender */}
                            <Text style={styles.label}>Gender</Text>
                            <View style={styles.genderRow}>
                                <TouchableOpacity style={styles.genderBtn}>
                                    <Text style={styles.genderText}>Male</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.genderBtn}>
                                    <Text style={styles.genderText}>Female</Text>
                                </TouchableOpacity>
                            </View>

                            {/* DOB */}
                            <Text style={styles.label}>DOB</Text>
                            <View style={styles.inputBox}>
                                <Text style={styles.inputText}>Enter Date of Birth</Text>
                                <Image source={Calendar} style={styles.iconSmall} />
                            </View>

                            {/* PAN */}
                            <Text style={styles.label}>Pan Number</Text>
                            <View style={styles.inputBox}>
                                <Text style={styles.inputText}>Mention PAN Number</Text>
                                <Image source={Attach} style={styles.iconSmall2} />
                            </View>

                            {/* AADHAR */}
                            <Text style={styles.label}>Aadhar Number</Text>
                            <View style={styles.inputBox}>
                                <Text style={styles.inputText}>Enter your aadhar number</Text>
                                <Image source={Attach} style={styles.iconSmall2} />
                            </View>

                            {/* FILE TAGS */}
                            {/* <View style={styles.fileTagRow}>
                                <View style={styles.fileTag}>
                                    <Text style={styles.fileTagText}>Aadhar Card Front ✕</Text>
                                </View>
                                <View style={styles.fileTag}>
                                    <Text style={styles.fileTagText}>Aadhar Card Back ✕</Text>
                                </View>
                            </View> */}

                            {/* SUBMIT */}
                            <TouchableOpacity style={styles.submitBtn}>
                                <Text style={styles.submitText}>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity style={setting ? styles.kycHeader : styles.kycHeaderclosed} onPress={() => setSetting(!setting)}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Image source={Setting} style={{ width: 30, height: 30, marginRight: 8, }} />
                            <Text style={styles.kycTitle}>Settings</Text>
                        </View>
                        <Image source={setting ? ArrowUp : ArrowDown} style={{ width: 15, height: 8 }} />
                    </TouchableOpacity>

                    {setting && (
                        <View style={styles.settingsCard}>

                            {/* <Text style={styles.label}>Language</Text>
                            <View style={styles.dropdownBox}>
                                <Text style={styles.inputText}>Select your language</Text>
                                <Image source={ArrowDown} style={{ width: 15, height: 8 }} />
                            </View>

                            <Text style={styles.label}>Theme</Text>
                            <View style={styles.themeRow}>
                                <Text style={styles.themeText}>Dark Mode</Text>

                                <View style={styles.toggleOuter}>
                                    <View style={styles.toggleCircle} />
                                </View>

                                <Text style={styles.themeText}>Light Mode</Text>
                            </View>

                            <View style={styles.divider} /> */}

                            {/* PASSWORD */}
                            <Text style={styles.label}>Change Password</Text>
                            <View style={styles.inputField}>
                                <Text style={styles.inputText}>Enter your new password</Text>
                            </View>

                            <Text style={styles.label}>Confirm Password</Text>
                            <View style={styles.inputField}>
                                <Text style={styles.inputText}>Re-enter your password</Text>
                            </View>

                            {/* SAVE BUTTON */}
                            <TouchableOpacity style={styles.saveBtn}>
                                <Text style={styles.saveBtnText}>Save Changes</Text>
                            </TouchableOpacity>

                        </View>

                    )}

                    <TouchableOpacity style={linkedAccount ? styles.kycHeader : styles.kycHeaderclosed} onPress={() => setLinkedAccount(!linkedAccount)}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Image source={LinkedAccount} style={{ width: 30, height: 30, marginRight: 8, }} />
                            <Text style={styles.kycTitle}>Linked Accounts</Text>
                        </View>
                        <Image source={linkedAccount ? ArrowUp : ArrowDown} style={{ width: 15, height: 8 }} />
                    </TouchableOpacity>

                    {linkedAccount && (
                        <View style={styles.linkedBox}>

                            {/* 🔹 ROW 1 */}
                            <View style={styles.row}>
                                <View style={styles.rowLeft}>
                                    <Image source={GrowIcon} style={styles.icon} />
                                    <Text style={styles.exchangeName}>Groww</Text>
                                </View>

                                <TouchableOpacity style={styles.refreshBtn}>
                                    <Image source={ProfileRefresh} style={styles.refreshIcon} />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.disconnectBtn}>
                                    <Text style={styles.disconnectText}>Disconnect</Text>
                                </TouchableOpacity>
                            </View>

                            {/* 🔹 ROW 2 */}
                            <View style={styles.row}>
                                <View style={styles.rowLeft}>
                                    <Image source={GrowIcon} style={styles.icon} />
                                    <Text style={styles.exchangeName}>Groww</Text>
                                </View>

                                <TouchableOpacity style={styles.refreshBtn}>
                                    <Image source={ProfileRefresh} style={styles.refreshIcon} />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.unlinkedBtn}>
                                    <Text style={styles.unlinkedText}>Unlinked</Text>
                                </TouchableOpacity>
                            </View>

                            {/* 🔹 ROW 3 */}
                            <View style={styles.row}>
                                <View style={styles.rowLeft}>
                                    <Image source={GrowIcon} style={styles.icon} />
                                    <Text style={styles.exchangeName}>Groww</Text>
                                </View>

                                <TouchableOpacity style={styles.refreshBtn}>
                                    <Image source={ProfileRefresh} style={styles.refreshIcon} />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.unlinkedBtn}>
                                    <Text style={styles.unlinkedText}>Unlinked</Text>
                                </TouchableOpacity>
                            </View>

                            {/* 🔹 ROW 4 */}
                            <View style={styles.row}>
                                <View style={styles.rowLeft}>
                                    <Image source={GrowIcon} style={styles.icon} />
                                    <Text style={styles.exchangeName}>Groww</Text>
                                </View>

                                <TouchableOpacity style={styles.refreshBtn}>
                                    <Image source={ProfileRefresh} style={styles.refreshIcon} />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.unlinkedBtn}>
                                    <Text style={styles.unlinkedText}>Unlinked</Text>
                                </TouchableOpacity>
                            </View>

                            {/* 🔹 ADD DEMAT BUTTON */}
                            <TouchableOpacity style={styles.addDematBtn}>
                                <Text style={styles.addDematText}>Add Demat</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* <TouchableOpacity style={accountPrivacy ? styles.kycHeader : styles.kycHeaderclosed} onPress={() => setAccountPrivacy(!accountPrivacy)}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Image source={LinkedAccount} style={{ width: 30, height: 30, marginRight: 8, }} />
                            <Text style={styles.kycTitle}>Account Privacy</Text>
                        </View>
                        <Image source={accountPrivacy ? ArrowUp : ArrowDown} style={{ width: 15, height: 8 }} />
                    </TouchableOpacity>

                    {accountPrivacy && (
                        <View style={styles.privacyCard}>

                            {[
                                "Profile Picture",
                                "Who Can Message You",
                                "Who Can Comment on Your Posts",
                                "Who Can Invite You to Groups",
                                "Allow Mentions in Posts",
                                "Website",
                                "Badges & Achievements",
                                "Contact Number Visibility",
                                "Email Visibility",
                            ].map((item, index) => (
                                <View key={index} style={styles.dropdownRow}>
                                    <View>
                                        <Text style={styles.dropdownTitle}>{item}</Text>
                                        <Text style={styles.dropdownSub}>Everyone</Text>
                                    </View>

                                    <Image
                                        source={ArrowDown}
                                        style={styles.arrowIcon}
                                    />
                                </View>
                            ))}
                        </View>
                    )} */}
                    {/* LOGOUT BUTTON */}
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>

                    {/* DELETE ACCOUNT BUTTON */}
                    <TouchableOpacity style={styles.deleteBtn}>
                        <Text style={styles.deleteText}>
                            <Image
                                source={DeleteIcon} style={{ height: 12, width: 11, }}
                            />&nbsp; Delete Account</Text>
                    </TouchableOpacity>
                </ScrollView>
                <Modal visible={editOpen} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>

                            <Text style={styles.modalTitle}>Edit Profile</Text>

                            {/* PROFILE IMAGE */}
                            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                                <Image
                                    source={getImageSource(editImage)}
                                    style={styles.modalImage}
                                />

                                <Text style={styles.uploadText}>Change Photo</Text>
                            </TouchableOpacity>

                            {/* NAME */}
                            <TextInput
                                style={styles.modalInput}
                                value={editName}
                                onChangeText={setEditName}
                                placeholder="Name"
                            />

                            {/* USERNAME */}
                            <TextInput
                                style={styles.modalInput}
                                value={editUsername}
                                onChangeText={setEditUsername}
                                placeholder="Username"
                            />

                            {/* MOBILE */}
                            <TextInput
                                style={styles.modalInput}
                                value={editMobile}
                                onChangeText={setEditMobile}
                                placeholder="Mobile Number"
                                keyboardType="phone-pad"
                            />

                            {/* EMAIL */}
                            <TextInput
                                style={styles.modalInput}
                                value={editEmail}
                                onChangeText={setEditEmail}
                                placeholder="Email ID"
                                keyboardType="email-address"
                            />

                            {/* BUTTONS */}
                            <View style={styles.modalBtnRow}>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => setEditOpen(false)}
                                >
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.saveBtnModal}
                                    onPress={handleSaveProfile}
                                >
                                    <Text style={styles.saveText}>Save</Text>
                                </TouchableOpacity>

                            </View>

                        </View>
                    </View>
                </Modal>

            </SafeAreaView>
            <BottomTabBar />
        </>
    );
};

export default ProfileScreen;

/* ------------------ STYLES ------------------ */
const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },

    modalCard: {
        width: "90%",
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#210F47",
        textAlign: "center",
        marginBottom: 12,
    },

    imagePicker: {
        alignItems: "center",
        marginBottom: 14,
    },

    modalImage: {
        width: 90,
        height: 90,
        borderRadius: 45,
    },

    uploadText: {
        marginTop: 6,
        fontSize: 13,
        fontWeight: "600",
        color: "#210F47",
    },

    modalInput: {
        backgroundColor: "#F3F0FA",
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginBottom: 10,
        fontSize: 14,
    },

    modalBtnRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 12,
    },

    cancelBtn: {
        width: "48%",
        borderWidth: 1,
        borderColor: "#210F47",
        paddingVertical: 10,
        borderRadius: 14,
        alignItems: "center",
    },

    cancelText: {
        color: "#210F47",
        fontWeight: "600",
    },

    saveBtnModal: {
        width: "48%",
        backgroundColor: "#210F47",
        paddingVertical: 10,
        borderRadius: 14,
        alignItems: "center",
    },

    saveText: {
        color: "#fff",
        fontWeight: "700",
    },

    logoutBtn: {
        width: "90%",
        alignSelf: "center",
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: "#210F47",
        marginTop: 15,
        marginBottom: 10,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
    },

    logoutText: {
        fontSize: 16,
        color: "#210F47",
        fontWeight: "600",
    },

    deleteBtn: {
        alignSelf: "center",
        paddingVertical: 10,
        paddingHorizontal: 24,
        backgroundColor: "#D62828",
        borderRadius: 20,
        marginTop: 10,
        marginBottom: 20,
    },

    deleteText: {
        fontSize: 14,
        color: "#fff",
        fontWeight: "600",
    },

    privacyCard: {
        backgroundColor: "#EFE9F6",
        marginHorizontal: 16,
        padding: 16,
        paddingTop: 10,
        borderRadius: 18,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
    },

    dropdownRow: {
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    dropdownTitle: {
        fontSize: 14,
        color: "#210F47",
        fontWeight: "600",
    },

    dropdownSub: {
        fontSize: 12,
        color: "#777",
        marginTop: 2,
    },

    arrowIcon: {
        width: 18,
        height: 10,
        tintColor: "#210F47",
    },

    linkedBox: {
        backgroundColor: "#EFE9F6",
        marginHorizontal: 16,
        padding: 16,
        paddingTop: 10,
        borderRadius: 18,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
    },

    row: {
        backgroundColor: "#fff",
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        marginBottom: 12,
    },

    rowLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },

    icon: {
        width: 32,
        height: 32,
        marginRight: 10,
    },

    exchangeName: {
        fontSize: 15,
        color: "#210F47",
        fontWeight: "600",
    },

    refreshBtn: {
        width: 38,
        height: 38,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },

    refreshIcon: {
        width: 30,
        height: 30,
    },

    disconnectBtn: {
        backgroundColor: "#210F47",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 10,
    },

    disconnectText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 13,
    },

    unlinkedBtn: {
        backgroundColor: "#210F47",
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 10,
    },

    unlinkedText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 13,
    },

    addDematBtn: {
        backgroundColor: "#210F47",
        paddingVertical: 10,
        borderRadius: 12,
        marginTop: 8,
        alignItems: "center",
    },

    addDematText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "700",
    },

    /* SETTINGS CARD */
    settingsCard: {
        backgroundColor: "#EFE9F6",
        marginHorizontal: 16,
        padding: 16,
        paddingTop: 10,
        borderRadius: 18,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
    },

    settingsHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 18,
    },

    settingsTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#210F47",
    },

    /* DROPDOWN */
    dropdownBox: {
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 18,
    },

    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#210F47",
        marginBottom: 6,
    },

    inputText: {
        color: "#777",
        fontSize: 14,
    },

    iconSmall2: {
        width: 18,
        height: 18,
        tintColor: "#210F47",
    },

    /* THEME TOGGLE */
    themeRow: {
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },

    themeText: {
        color: "#210F47",
        fontSize: 14,
        fontWeight: "600",
    },

    toggleOuter: {
        width: 50,
        height: 24,
        backgroundColor: "#ddd",
        borderRadius: 20,
        justifyContent: "center",
    },

    toggleCircle: {
        width: 20,
        height: 20,
        backgroundColor: "#fff",
        borderRadius: 50,
        marginLeft: 3,
    },

    /* DIVIDER */
    divider: {
        height: 1,
        backgroundColor: "#C8C1D6",
        marginBottom: 20,
    },

    /* INPUT FIELDS */
    inputField: {
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 16,
    },

    /* BUTTON */
    saveBtn: {
        backgroundColor: "#210F47",
        paddingVertical: 10,
        borderRadius: 14,
        alignItems: "center",
        marginTop: 10,
    },

    saveBtnText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },

    container: {
        flex: 1,
        backgroundColor: "#fff",
    },

    /* PROFILE CARD */
    profileCard: {
        marginTop: 15,
        marginHorizontal: 16,
        paddingTop: 10,
        backgroundColor: "#EFE9F6",
        borderRadius: 18,
        padding: 16,
        elevation: 3,
        position: "relative", // 👈 REQUIRED
    },

    topRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    profileImage: {
        width: 90,
        height: 110,
        borderRadius: 12,
    },

    nameRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    nameText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#210F47",
    },

    docIcon: {
        padding: 4,
        borderRadius: 6,
        marginLeft: 6,
    },

    username: { fontSize: 14, color: "#777", marginTop: 4 },
    contact: { fontSize: 14, color: "#777", marginTop: 2 },
    location: { fontSize: 14, color: "#777", marginTop: 2 },

    editBtn: {
        position: "absolute",
        right: 0,
        top: 0,
        borderRadius: 20,
    },

    planRow: {
        marginTop: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    planLabel: { fontSize: 10, color: "#777" },
    dateLabel: { fontSize: 10, color: "#777" },

    planStatus: {
        fontSize: 14,
        fontWeight: "700",
        color: "green",
        marginTop: 2,
    },

    planBtn: {
        borderWidth: 1,
        borderColor: "#210F47",
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 20,
    },

    planBtnText: {
        fontSize: 11,
        color: "#210F47",
        fontWeight: "600",
    },


    /* PORTFOLIO CARD */
    portfolioMainCard: {
        marginTop: 15,
        marginHorizontal: 16,
        backgroundColor: "#EFE9F6",
        borderRadius: 18,
        padding: 18,
        elevation: 3,
        flexDirection: "row",
        justifyContent: "space-between",
    },

    cardTitle: {
        fontSize: 13,
        color: "#555",
        fontWeight: "600",
    },

    cardTitleRight: {
        fontSize: 13,
        color: "#555",
        fontWeight: "600",
        textAlign: "center",
    },

    bigAmount: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1CA95A",
        marginTop: 4,
    },

    greenGain: {
        fontSize: 12,
        color: "#1CA95A",
    },

    investedAmount: {
        fontSize: 15,
        fontWeight: "700",
        color: "#210F47",
        marginTop: 6,
    },

    listRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 3,
    },

    dot: {
        width: 12,
        height: 12,
        borderRadius: 3,
        marginRight: 8,
    },

    listText: {
        fontSize: 12,
        color: "#444",
        flex: 1,
    },

    listAmount: {
        fontSize: 12,
        fontWeight: "500",
        color: "#000",
    },


    /* 3 STATS CARDS */
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 15,
        marginHorizontal: 16,
    },

    statsCard: {
        backgroundColor: "#EFE9F6",
        flex: 1,
        marginHorizontal: 4,
        borderRadius: 16,
        alignItems: "center",
        elevation: 3,
        paddingBottom: 10,
    },

    statsIcon: { width: 22, height: 22, marginTop: 10, marginBottom: 5 },

    statsTitle: {
        fontSize: 10,
        color: "#777",
        textAlign: "center",
    },

    statsValue: {
        fontSize: 12,
        fontWeight: "700",
        color: "#210F47",
        marginTop: 2,
    },

    statsCode: {
        fontSize: 10,
        color: "#210F47",
        marginTop: 2,
    },

    badgesSection: {
        marginTop: 20,
        marginHorizontal: 16,
    },

    badgesTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#210F47",
        marginBottom: 10,
    },

    badgeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    badgeCard: {
        backgroundColor: "#210F47",
        padding: 10,
        borderRadius: 30,
        alignItems: "center",
        width: 80,
    },

    badgeIcon: { width: 22, height: 22, },
    badgeInnerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    badgeCount: { color: "#fff", fontSize: 14, fontWeight: "700", },

    badgeLabel: { color: "#210F47", fontSize: 11, marginTop: 5, textAlign: "center" },

    badgeInactive: {
        backgroundColor: "#DAD4E4",
        padding: 10,
        borderRadius: 30,
        alignItems: "center",
        width: 70,
    },

    badgeIconInactive: { width: 22, height: 22, tintColor: "#777" },

    badgeLabelInactive: { color: "#777", fontSize: 11 },


    /* KYC COLLAPSIBLE */
    kycHeader: {
        marginTop: 10,
        backgroundColor: "#EFE9F6",
        marginHorizontal: 16,
        padding: 14,
        borderRadius: 16,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    kycHeaderclosed: {
        marginTop: 10,
        backgroundColor: "#EFE9F6",
        marginHorizontal: 16,
        padding: 14,
        borderRadius: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    kycTitle: { fontSize: 15, fontWeight: "700", color: "#210F47" },

    kycPercent: { marginLeft: 8, fontWeight: "700", color: "#210F47" },

    kycBody: {
        backgroundColor: "#EFE9F6",
        marginHorizontal: 16,
        padding: 16,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        marginTop: -8,
    },

    label: {
        fontSize: 13,
        fontWeight: "600",
        color: "#210F47",
        marginBottom: 6,
        // marginTop: 8,
    },

    genderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },

    genderBtn: {
        backgroundColor: "#fff",
        borderRadius: 12,
        width: "48%",
        paddingVertical: 12,
        alignItems: "center",
    },

    genderText: { fontSize: 14, color: "#210F47", fontWeight: "600" },

    inputBox: {
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },

    inputText: { color: "#777" },

    iconSmall: { width: 16, height: 17, tintColor: "#210F47" },
    iconSmall2: { width: 22, height: 25, tintColor: "#210F47" },

    fileTagRow: {
        flexDirection: "row",
        marginTop: 10,
    },

    fileTag: {
        backgroundColor: "#fff",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginRight: 8,
    },

    fileTagText: { fontSize: 12, color: "#210F47" },

    submitBtn: {
        backgroundColor: "#210F47",
        paddingVertical: 10,
        borderRadius: 16,
        marginTop: 16,
        alignItems: "center",
    },

    submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },

});
