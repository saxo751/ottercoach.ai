import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RetroWindow } from '../../src/components/RetroWindow';
import { useLibrary } from '../../src/hooks/use-techniques';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';
import { Icon } from '../../src/components/icon';
import type { LibraryTechnique } from '../../src/types';

function TechniqueCard({ technique }: { technique: LibraryTechnique }) {
  const [expanded, setExpanded] = useState(false);
  const url = technique.youtube_url || technique.youtube_search_url;

  function handleToggle() {
    setExpanded((prev) => !prev);
  }

  function handleOpenVideo() {
    if (url) Linking.openURL(url);
  }

  return (
    <Pressable style={styles.card} onPress={handleToggle}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardName}>{technique.name}</Text>
          <Text style={styles.cardMeta}>{technique.category} — {technique.subcategory}</Text>
        </View>
        <Icon
          name={expanded ? 'arrow-up-01' : 'arrow-down-01'}
          size={18}
          color={colors.textMuted}
        />
      </View>

      {expanded && (
        <View style={styles.expandedSection}>
          {technique.starting_position ? (
            <Text style={styles.cardPosition}>
              <Text style={styles.cardPositionLabel}>Starts in: </Text>
              {technique.starting_position}
            </Text>
          ) : null}

          {technique.description ? (
            <Text style={styles.cardDesc}>{technique.description}</Text>
          ) : (
            <Text style={styles.cardDescEmpty}>No description yet.</Text>
          )}

          {url && (
            <Pressable
              style={({ pressed }) => [styles.videoButton, pressed && styles.videoButtonPressed]}
              onPress={handleOpenVideo}
              hitSlop={6}
            >
              <Text style={styles.videoButtonIcon}>▶</Text>
              <Text style={styles.videoButtonText}>Watch on YouTube</Text>
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}

export default function TechniquesScreen() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: techniques, isLoading } = useLibrary({ search: debouncedSearch || undefined });

  function handleSearch(text: string) {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(text), 300);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <RetroWindow
        title="techniques/"
        statusLeft={`${techniques?.length ?? 0} techniques`}
        statusRight="tap to expand"
        scrollable={false}
        otterImage={require('../../assets/otters/Otter-armbar-turtle.png')}
      >
        <View style={styles.searchBar}>
          <Icon name="search-01" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={handleSearch}
            placeholder="Search techniques..."
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 32 }} />
        ) : (
          <FlatList
            data={techniques}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <TechniqueCard technique={item} />}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <Text style={styles.empty}>No techniques found.</Text>
            }
          />
        )}
      </RetroWindow>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.dark },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.light, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: fonts.mono,
    color: colors.text,
    backgroundColor: colors.white,
  },
  list: { padding: 16 },
  card: { backgroundColor: colors.white, borderRadius: 8, padding: 14, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  cardHeaderText: { flex: 1, flexShrink: 1 },
  cardName: { fontFamily: fonts.mono, fontSize: 14, color: colors.text, marginBottom: 2 },
  cardMeta: { fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted },
  expandedSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, gap: 10 },
  cardPosition: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  cardPositionLabel: { fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardDesc: { fontFamily: fonts.body, fontSize: 14, color: colors.text, lineHeight: 20 },
  cardDescEmpty: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  videoButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6, marginTop: 4 },
  videoButtonPressed: { opacity: 0.85 },
  videoButtonIcon: { color: colors.white, fontSize: 11 },
  videoButtonText: { fontFamily: fonts.heading, fontSize: 13, fontWeight: '600', color: colors.white },
  separator: { height: 10 },
  empty: { fontFamily: fonts.mono, fontSize: 13, color: colors.textMuted, textAlign: 'center', padding: 32, fontStyle: 'italic' },
});
