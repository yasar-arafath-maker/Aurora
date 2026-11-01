package com.aurora.solar.ui.screens

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

data class SpacePresetModel(
    val id: String,
    val nameEn: String,
    val nameTa: String,
    val icon: String,
    val defaultPanels: Int = 6
)

data class SolarUiState(
    val selectedSpace: SpacePresetModel = SpacePresetModel("terrace", "Flat Roof", "மொட்டை மாடி", "🏢", 6),
    val panelCount: Int = 6,
    val sliderPosition: Float = 0.5f, // 0.0 (Now) to 1.0 (Solar)
    val isTamil: Boolean = true,
    val isCameraActive: Boolean = false,
    val showCallSheet: Boolean = false
) {
    val kwCapacity: Float get() = (panelCount * 0.54f)
    val monthlyUnits: Int get() = panelCount * 70
    val monthlySavingsRs: Int get() = (monthlyUnits * 8.5f).toInt()
    val yearlySavingsRs: Int get() = monthlySavingsRs * 12
    val lifetimeSavingsRs: Int get() = yearlySavingsRs * 25
    val subsidyAmountRs: Int get() = when {
        panelCount <= 4 -> 30000
        panelCount <= 6 -> 60000
        else -> 78000
    }
    val grossCostRs: Int get() = panelCount * 22000
    val netCostRs: Int get() = maxOf(0, grossCostRs - subsidyAmountRs)
}

class SolarMetricsViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(SolarUiState())
    val uiState: StateFlow<SolarUiState> = _uiState.asStateFlow()

    val spacePresets = listOf(
        SpacePresetModel("terrace", "Flat Roof", "மொட்டை மாடி", "🏢", 6),
        SpacePresetModel("balcony", "Apartment Balcony", "பால்கனி", "🌿", 3),
        SpacePresetModel("pitched", "Slanted Tile Roof", "ஓட்டு வீடு", "🏠", 8),
        SpacePresetModel("shed", "Metal Tin Shed", "டின் கொட்டகை", "🏭", 10),
        SpacePresetModel("garden", "Open Backyard", "தோட்டம்", "🌳", 12)
    )

    fun setSliderPosition(pos: Float) {
        _uiState.update { it.copy(sliderPosition = pos.coerceIn(0f, 1f)) }
    }

    fun incrementPanels() {
        _uiState.update { if (it.panelCount < 12) it.copy(panelCount = it.panelCount + 1) else it }
    }

    fun decrementPanels() {
        _uiState.update { if (it.panelCount > 2) it.copy(panelCount = it.panelCount - 1) else it }
    }

    fun selectPreset(preset: SpacePresetModel) {
        _uiState.update { it.copy(selectedSpace = preset, panelCount = preset.defaultPanels) }
    }

    fun toggleLanguage() {
        _uiState.update { it.copy(isTamil = !it.isTamil) }
    }

    fun setCameraActive(active: Boolean) {
        _uiState.update { it.copy(isCameraActive = active) }
    }

    fun setShowCallSheet(show: Boolean) {
        _uiState.update { it.copy(showCallSheet = show) }
    }
}
