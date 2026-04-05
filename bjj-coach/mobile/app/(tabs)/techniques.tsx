import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
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
import type { LibraryTechnique } from '../../src/types';

function TechniqueCard({ technique }: { technique: LibraryTechnique }) {
  const url = technique.youtube_url || technique.youtube_search_url;

  function handlePress() {
    if (url) Linking.openURL(url);
  }

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={url ? 0.7 : 1}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{technique.name}</Text>
        {url && <Text style={styles.videoIcon}>▶</Text>}
      </View>
      <Text style={styles.cardMeta}>{technique.category} — {technique.subcategory}</Text>
      {technique.description && (
        <Text style={styles.cardDesc} numberOfLines={2}>{technique.description}</Text>
      )}
    </TouchableOpacity>
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
        statusRight="tap to watch"
        scrollable={false}
      >
        <View style={styles.searchBar}>
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
  searchBar: { backgroundColor: colors.parchment, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardName: { fontFamily: fonts.mono, fontSize: 14, color: colors.text, flex: 1, flexShrink: 1 },
  videoIcon: { fontSize: 12, color: colors.accent, marginLeft: 8 },
  cardMeta: { fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted, marginBottom: 6 },
  cardDesc: { fontFamily: fonts.body, fontSize: 13, color: '#555', lineHeight: 18 },
  separator: { height: 10 },
  empty: { fontFamily: fonts.mono, fontSize: 13, color: colors.textMuted, textAlign: 'center', padding: 32, fontStyle: 'italic' },
});
