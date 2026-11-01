package com.aurora.solar

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.runtime.*
import androidx.core.content.ContextCompat
import com.aurora.solar.ui.screens.BeforeAfterComparisonScreen
import com.aurora.solar.ui.screens.CameraScanScreen
import com.aurora.solar.ui.screens.SolarMetricsViewModel
import com.aurora.solar.ui.theme.AuroraSolarTheme

class MainActivity : ComponentActivity() {

    private val viewModel: SolarMetricsViewModel by viewModels()
    private var isCameraScreenOpen by mutableStateOf(false)

    private val cameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            isCameraScreenOpen = true
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            AuroraSolarTheme {
                if (isCameraScreenOpen) {
                    CameraScanScreen(
                        onCaptureComplete = {
                            isCameraScreenOpen = false
                        },
                        onBack = {
                            isCameraScreenOpen = false
                        }
                    )
                } else {
                    BeforeAfterComparisonScreen(
                        viewModel = viewModel,
                        onOpenLiveCamera = {
                            if (ContextCompat.checkSelfPermission(
                                    this,
                                    Manifest.permission.CAMERA
                                ) == PackageManager.PERMISSION_GRANTED
                            ) {
                                isCameraScreenOpen = true
                            } else {
                                cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                            }
                        }
                    )
                }
            }
        }
    }
}
