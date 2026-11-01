package com.aurora.solar.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aurora.solar.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BeforeAfterComparisonScreen(
    viewModel: SolarMetricsViewModel,
    onOpenLiveCamera: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val scrollState = rememberScrollState()

    Scaffold(
        containerColor = DarkBackground,
        topBar = {
            // App Bar with Bilingual Toggle
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DarkCard)
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(
                                Brush.linearGradient(listOf(AmberSolar, TealCyan))
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.WbSunny,
                            contentDescription = "Solar",
                            tint = DarkBackground,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = if (state.isTamil) "அரோரா சோலார்" else "Aurora Solar AI",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "PRO",
                                color = TealCyan,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Black,
                                modifier = Modifier
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(TealCyan.copy(alpha = 0.2f))
                                    .padding(horizontal = 4.dp, vertical = 1.dp)
                            )
                        }
                        Text(
                            text = if (state.isTamil) "உங்கள் வீட்டிற்கான எளிய சோலார்" else "Instant Rooftop Solar Comparison",
                            color = TextSecondary,
                            fontSize = 11.sp
                        )
                    }
                }

                // Language Switcher
                Surface(
                    onClick = { viewModel.toggleLanguage() },
                    shape = RoundedCornerShape(8.dp),
                    color = DarkCardSecondary,
                    border = BorderStroke(1.dp, AmberSolar.copy(alpha = 0.5f))
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Language,
                            contentDescription = "Lang",
                            tint = AmberSolar,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = if (state.isTamil) "தமிழ்" else "ENG",
                            color = AmberSolar,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(scrollState)
        ) {
            // Horizontal Space Selector
            Text(
                text = if (state.isTamil) "இடத்தை தேர்வு செய்க:" else "Choose Space Type:",
                color = TextSecondary,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.padding(start = 16.dp, top = 10.dp, bottom = 6.dp)
            )

            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(viewModel.spacePresets) { preset ->
                    val isSelected = preset.id == state.selectedSpace.id
                    Surface(
                        onClick = { viewModel.selectPreset(preset) },
                        shape = RoundedCornerShape(20.dp),
                        color = if (isSelected) TealCyan else DarkCard,
                        border = if (isSelected) null else BorderStroke(1.dp, Color.White.copy(alpha = 0.15f))
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = preset.icon, fontSize = 14.sp)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = if (state.isTamil) preset.nameTa else preset.nameEn,
                                color = if (isSelected) DarkBackground else Color.White,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // ═══════════════════════════════════════════════════════════════════════
            // BEFORE-AFTER INTERACTIVE COMPARISON CANVAS
            // ═══════════════════════════════════════════════════════════════════════
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(300.dp)
                    .padding(horizontal = 16.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(Color.Black)
                    .pointerInput(Unit) {
                        detectDragGestures { change, dragAmount ->
                            change.consume()
                            val width = size.width
                            val newPos = (state.sliderPosition + (dragAmount.x / width)).coerceIn(0f, 1f)
                            viewModel.setSliderPosition(newPos)
                        }
                    }
            ) {
                // 1. "NOW" BACKGROUND LAYER (LEFT)
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                listOf(Color(0xFF1E293B), Color(0xFF0F172A))
                            )
                        )
                ) {
                    // Empty space illustration
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(text = state.selectedSpace.icon, fontSize = 54.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = if (state.isTamil) state.selectedSpace.nameTa else state.selectedSpace.nameEn,
                            color = Color.LightGray,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = if (state.isTamil) "இபி பில்: ₹3,500/மாதம்" else "Current EB Bill: ₹3,500/mo",
                            color = RedNow,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(RedNow.copy(alpha = 0.15f))
                                .padding(horizontal = 8.dp, vertical = 2.dp)
                        )
                    }

                    // "NOW" Badge
                    Surface(
                        color = RedNow,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .padding(10.dp)
                            .align(Alignment.TopStart)
                    ) {
                        Text(
                            text = if (state.isTamil) "இப்போது" else "NOW",
                            color = Color.White,
                            fontWeight = FontWeight.Black,
                            fontSize = 10.sp,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }

                // 2. "WITH SOLAR" LAYER (RIGHT - CLIPPED DYNAMICALLY)
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .drawWithContent {
                            val clipX = size.width * state.sliderPosition
                            clipRect(left = clipX, top = 0f, right = size.width, bottom = size.height) {
                                this@drawWithContent.drawContent()
                            }
                        }
                        .background(
                            Brush.verticalGradient(
                                listOf(Color(0xFF052e2b), Color(0xFF090D12))
                            )
                        )
                ) {
                    // Sun glow in corner
                    Box(
                        modifier = Modifier
                            .size(100.dp)
                            .align(Alignment.TopEnd)
                            .background(
                                Brush.radialGradient(
                                    listOf(AmberGlow.copy(alpha = 0.4f), Color.Transparent)
                                )
                            )
                    )

                    // 3D Solar Panel Array simulation
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            repeat(minOf(4, state.panelCount)) {
                                SolarPanelCell(index = it + 1)
                            }
                        }
                        if (state.panelCount > 4) {
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                repeat(state.panelCount - 4) {
                                    SolarPanelCell(index = it + 5)
                                }
                            }
                        }
                    }

                    // "WITH SOLAR" Badge
                    Column(
                        modifier = Modifier
                            .padding(10.dp)
                            .align(Alignment.TopEnd),
                        horizontalAlignment = Alignment.End
                    ) {
                        Surface(
                            color = TealCyan,
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text(
                                text = if (state.isTamil) "சோலார் வைத்தபின்" else "WITH SOLAR",
                                color = DarkBackground,
                                fontWeight = FontWeight.Black,
                                fontSize = 10.sp,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Surface(
                            color = GreenSavings,
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = if (state.isTamil) "பில்: ₹0/மாதம்" else "Zero Bill: ₹0/mo",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 9.sp,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                }

                // 3. VERTICAL DIVIDER & DRAG HANDLE
                Box(
                    modifier = Modifier
                        .fillMaxHeight()
                        .width(3.dp)
                        .offset(x = 16.dp + (268.dp * state.sliderPosition)) // approximate alignment
                        .background(Color.White)
                )

                // Drag Thumb Circle at center
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .align(Alignment.CenterStart)
                        .offset(x = (280.dp * state.sliderPosition) - 2.dp)
                        .clip(CircleShape)
                        .background(Color.White)
                        .border(2.dp, TealCyan, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "↔",
                        color = DarkBackground,
                        fontWeight = FontWeight.Black,
                        fontSize = 16.sp
                    )
                }

                // Drag hint banner
                Surface(
                    color = Color.Black.copy(alpha = 0.75f),
                    shape = RoundedCornerShape(20.dp),
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(bottom = 8.dp)
                ) {
                    Text(
                        text = if (state.isTamil) "இடது / வலதுபுறம் நகர்த்தி பாருங்கள் ↔" else "Drag handle left / right to compare ↔",
                        color = Color.White,
                        fontSize = 10.sp,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                    )
                }

                // Snap Live Camera button
                Surface(
                    onClick = onOpenLiveCamera,
                    color = DarkCard.copy(alpha = 0.85f),
                    shape = RoundedCornerShape(20.dp),
                    border = BorderStroke(1.dp, TealCyan.copy(alpha = 0.5f)),
                    modifier = Modifier
                        .align(Alignment.TopCenter)
                        .padding(top = 10.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.CameraAlt,
                            contentDescription = "Camera",
                            tint = TealCyan,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = if (state.isTamil) "கேமரா படம்" else "Live Camera",
                            color = Color.White,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // ═══════════════════════════════════════════════════════════════════════
            // PANEL STEPPER CONTROLS
            // ═══════════════════════════════════════════════════════════════════════
            Surface(
                color = DarkCard,
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f)),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = if (state.isTamil) "பேனல் எண்ணிக்கை:" else "Adjust Panel Count:",
                            color = TextSecondary,
                            fontSize = 11.sp
                        )
                        Row(verticalAlignment = Alignment.Baseline) {
                            Text(
                                text = "${state.panelCount}",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 20.sp,
                                fontFamily = FontFamily.Monospace
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = if (state.isTamil) "பேனல்கள்" else "Panels",
                                color = TextSecondary,
                                fontSize = 12.sp
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "(${String.format("%.1f", state.kwCapacity)} kW)",
                                color = TealCyan,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp
                            )
                        }
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilledIconButton(
                            onClick = { viewModel.decrementPanels() },
                            colors = IconButtonDefaults.filledIconButtonColors(containerColor = DarkCardSecondary),
                            modifier = Modifier.size(38.dp)
                        ) {
                            Icon(Icons.Default.Remove, contentDescription = "Minus", tint = Color.White)
                        }
                        FilledIconButton(
                            onClick = { viewModel.incrementPanels() },
                            colors = IconButtonDefaults.filledIconButtonColors(containerColor = TealCyan),
                            modifier = Modifier.size(38.dp)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = "Plus", tint = DarkBackground)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // ═══════════════════════════════════════════════════════════════════════
            // 3 BIG BENEFIT METRICS CARDS
            // ═══════════════════════════════════════════════════════════════════════
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Card 1: Monthly Savings
                MetricCard(
                    title = if (state.isTamil) "மாத சேமிப்பு" else "Monthly Save",
                    value = "₹${state.monthlySavingsRs}",
                    subtitle = if (state.isTamil) "ஒவ்வொரு மாதமும்" else "per month",
                    accentColor = GreenSavings,
                    modifier = Modifier.weight(1f)
                )
                // Card 2: Green Power
                MetricCard(
                    title = if (state.isTamil) "இலவச கரண்ட்" else "Free Power",
                    value = "${state.monthlyUnits}",
                    subtitle = if (state.isTamil) "யூனிட் / மாதம்" else "Units / Mo",
                    accentColor = TealCyan,
                    modifier = Modifier.weight(1f)
                )
                // Card 3: Govt Subsidy
                MetricCard(
                    title = if (state.isTamil) "அரசு மானியம்" else "Govt Subsidy",
                    value = "₹${state.subsidyAmountRs / 1000}k",
                    subtitle = if (state.isTamil) "நேரடி வங்கி பணம்" else "PM Surya Ghar",
                    accentColor = AmberSolar,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Net Cost & 25-Year Value Banner
            Surface(
                color = DarkCard,
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, TealCyan.copy(alpha = 0.2f)),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = if (state.isTamil) "மானியம் போக உங்கள் செலவு:" else "Net Cost After Subsidy:",
                            color = TextSecondary,
                            fontSize = 11.sp
                        )
                        Text(
                            text = "₹${state.netCostRs}",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = if (state.isTamil) "25 ஆண்டு சேமிப்பு:" else "25-Yr Lifetime Savings:",
                            color = TextSecondary,
                            fontSize = 11.sp
                        )
                        Text(
                            text = "₹${state.lifetimeSavingsRs / 100000} Lakhs",
                            color = GreenSavings,
                            fontWeight = FontWeight.Black,
                            fontSize = 15.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // ═══════════════════════════════════════════════════════════════════════
            // ACTION BUTTONS: CALL INSTALLER & SHARE WHATSAPP
            // ═══════════════════════════════════════════════════════════════════════
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Button(
                    onClick = { viewModel.setShowCallSheet(true) },
                    colors = ButtonDefaults.buttonColors(containerColor = TealCyan),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Phone,
                        contentDescription = "Call",
                        tint = DarkBackground,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (state.isTamil) "📞 சோலார் நிபுணருடன் பேசுங்கள்" else "📞 Call Approved Solar Expert",
                        color = DarkBackground,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // WhatsApp Share
                    OutlinedButton(
                        onClick = {
                            val msg = if (state.isTamil) {
                                "என் வீட்டிற்கு சோலார் வைக்க மதிப்பீடு கிடைத்தது: மாதம் ₹${state.monthlySavingsRs} மிச்சம்! மத்திய அரசு மானியம் ₹${state.subsidyAmountRs}"
                            } else {
                                "Got my Solar Feasibility report! Save ₹${state.monthlySavingsRs}/month with ₹${state.subsidyAmountRs} PM Surya Ghar Subsidy!"
                            }
                            val intent = Intent(Intent.ACTION_VIEW).apply {
                                data = Uri.parse("https://api.whatsapp.com/send?text=${Uri.encode(msg)}")
                            }
                            context.startActivity(intent)
                        },
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, GreenSavings.copy(alpha = 0.5f)),
                        modifier = Modifier
                            .weight(1f)
                            .height(44.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Share,
                            contentDescription = "Share",
                            tint = GreenSavings,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (state.isTamil) "வாட்ஸ்அப் பகிர்" else "WhatsApp",
                            color = GreenSavings,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    // PDF Download
                    OutlinedButton(
                        onClick = {
                            val callIntent = Intent(Intent.ACTION_DIAL).apply {
                                data = Uri.parse("tel:18002097788")
                            }
                            context.startActivity(callIntent)
                        },
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.2f)),
                        modifier = Modifier
                            .weight(1f)
                            .height(44.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Description,
                            contentDescription = "PDF",
                            tint = Color.White,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (state.isTamil) "அறிக்கை PDF" else "Solar Report",
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }

        // Call Installer Bottom Sheet
        if (state.showCallSheet) {
            AlertDialog(
                onDismissRequest = { viewModel.setShowCallSheet(false) },
                containerColor = DarkCard,
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Verified, contentDescription = null, tint = TealCyan)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (state.isTamil) "அங்கீகரிக்கப்பட்ட சோலார் நிறுவனம்" else "Certified Solar Partner",
                            color = Color.White,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = if (state.isTamil)
                                "டாடா பவர் மற்றும் அதானி சோலார் அங்கீகரிக்கப்பட்ட பொறியாளர்கள் உங்கள் இடத்தை இலவசமாக பார்வையிடுவார்கள்."
                            else
                                "Tata Power & Adani Solar certified installers will conduct a 100% free site survey.",
                            color = TextSecondary,
                            fontSize = 12.sp
                        )
                        Surface(
                            color = DarkBackground,
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Text(
                                    text = "Space: ${state.selectedSpace.nameEn}",
                                    color = Color.White,
                                    fontSize = 12.sp
                                )
                                Text(
                                    text = "System: ${state.panelCount} Panels (${String.format("%.1f", state.kwCapacity)} kW)",
                                    color = TealCyan,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Subsidy: ₹${state.subsidyAmountRs}",
                                    color = AmberSolar,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            viewModel.setShowCallSheet(false)
                            val callIntent = Intent(Intent.ACTION_DIAL).apply {
                                data = Uri.parse("tel:18002097788")
                            }
                            context.startActivity(callIntent)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = TealCyan)
                    ) {
                        Text(
                            text = if (state.isTamil) "இப்போதே அழைக்க" else "Call Toll-Free",
                            color = DarkBackground,
                            fontWeight = FontWeight.Bold
                        )
                    }
                },
                dismissButton = {
                    TextButton(onClick = { viewModel.setShowCallSheet(false) }) {
                        Text(text = "Close", color = TextSecondary)
                    }
                }
            )
        }
    }
}

@Composable
fun MetricCard(
    title: String,
    value: String,
    subtitle: String,
    accentColor: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        color = accentColor.copy(alpha = 0.1f),
        shape = RoundedCornerShape(12.dp),
        border = BorderStroke(1.dp, accentColor.copy(alpha = 0.35f)),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(vertical = 10.dp, horizontal = 6.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = title,
                color = accentColor,
                fontSize = 10.sp,
                fontWeight = FontWeight.SemiBold,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = value,
                color = Color.White,
                fontWeight = FontWeight.Black,
                fontSize = 16.sp,
                fontFamily = FontFamily.Monospace,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(1.dp))
            Text(
                text = subtitle,
                color = accentColor.copy(alpha = 0.8f),
                fontSize = 9.sp,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
fun SolarPanelCell(index: Int) {
    Box(
        modifier = Modifier
            .size(width = 54.dp, height = 74.dp)
            .clip(RoundedCornerShape(6.dp))
            .background(
                Brush.verticalGradient(
                    listOf(Color(0xFF1E3A8A), Color(0xFF0F172A))
                )
            )
            .border(1.dp, TealCyan, RoundedCornerShape(6.dp))
            .padding(2.dp)
    ) {
        Box(
            modifier = Modifier
                .size(4.dp)
                .clip(CircleShape)
                .background(TealCyan)
                .align(Alignment.TopStart)
        )
        Text(
            text = "540W",
            color = TealCyan,
            fontSize = 7.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.align(Alignment.TopEnd)
        )
        Text(
            text = "#$index",
            color = AmberSolar,
            fontSize = 8.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.align(Alignment.BottomCenter)
        )
    }
}
